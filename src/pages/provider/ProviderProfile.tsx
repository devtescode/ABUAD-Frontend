import {
    useEffect,
    useRef,
    useState,
} from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Image as ImageIcon,
    MapPin,
    Mail,
    Save,
    User,
    ArrowRight,
    ChevronDown,
    X,
    AlertCircle,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { VerifiedBadge } from "@/components/shared";
import { useAuth } from "@/context/AppContext";
import { providers } from "@/data/mockData";
import { providerNavItems } from "@/data/providerNavItems";

type NotificationType = "success" | "error";

interface Notification {
    type: NotificationType;
    message: string;
}

export function ProviderProfile() {
    const { user, updateProfile } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const notificationTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentProvider = providers.find(
        (provider) => provider.id === user?.id
    );

    const [profileImage, setProfileImage] = useState(
        user?.avatar || "/images/default-avatar.png"
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

    const [isSaving, setIsSaving] = useState(false);

    const [notification, setNotification] =
        useState<Notification | null>(null);

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
            setProfileImage("/images/default-avatar.png");
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
                "/images/default-avatar.png"
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

        if (about.trim().length < 10) {
            showNotification(
                "error",
                "Please provide a little more information in your About section."
            );

            return false;
        }

        if (about.length > 500) {
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
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            showNotification(
                "error",
                "Please choose a JPG, PNG, or WebP image."
            );

            event.target.value = "";

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
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

        if (profileImage.startsWith("blob:")) {
            URL.revokeObjectURL(profileImage);
        }

        const imageUrl =
            URL.createObjectURL(file);

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

    const handleSave = async () => {
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

        if (about.trim().length < 10) {
            showNotification(
                "error",
                "Please provide a little more information in your About section."
            );

            return;
        }

        if (about.length > 500) {
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

        const hasExistingAvatar =
            Boolean(user?.avatar);

        if (!selectedImage && !hasExistingAvatar) {
            showNotification(
                "error",
                "Please add a profile picture before saving your profile."
            );

            return;
        }

        setIsSaving(true);

        try {
            const data = await updateProfile({
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
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            {/* 
            |--------------------------------------------------------------------------
            | FIXED NOTIFICATION
            |--------------------------------------------------------------------------
            */}

            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -20,
                            scale: 0.96,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: -20,
                            scale: 0.96,
                        }}
                        transition={{
                            duration: 0.25,
                        }}
                        className="
                            fixed
                            left-3
                            right-3
                            top-4
                            z-[9999]
                            sm:left-auto
                            sm:right-5
                            sm:top-5
                            sm:w-[420px]
                        "
                    >
                        <div
                            className={`
                                relative
                                overflow-hidden
                                rounded-2xl
                                border
                                bg-white
                                p-4
                                pr-12
                                shadow-2xl
                                backdrop-blur-xl
                                dark:bg-ink-900
                                ${notification.type ===
                                    "success"
                                    ? "border-emerald-200 dark:border-emerald-900/60"
                                    : "border-red-200 dark:border-red-900/60"
                                }
                            `}
                        >
                            {/* Notification Icon */}

                            <div
                                className={`
                                    absolute
                                    left-4
                                    top-1/2
                                    flex
                                    h-9
                                    w-9
                                    -translate-y-1/2
                                    items-center
                                    justify-center
                                    rounded-xl
                                    ${notification.type ===
                                        "success"
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                        : "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                                    }
                                `}
                            >
                                {notification.type ===
                                    "success" ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                            </div>

                            {/* Message */}

                            <div className="ml-12">
                                <p
                                    className={`
                                        text-sm
                                        font-semibold
                                        ${notification.type ===
                                            "success"
                                            ? "text-emerald-800 dark:text-emerald-300"
                                            : "text-red-800 dark:text-red-300"
                                        }
                                    `}
                                >
                                    {notification.type ===
                                        "success"
                                        ? "Success"
                                        : "Something went wrong"}
                                </p>

                                <p className="mt-0.5 text-sm leading-5 text-ink-600 dark:text-ink-300">
                                    {
                                        notification.message
                                    }
                                </p>
                            </div>

                            {/* Close */}

                            <button
                                type="button"
                                onClick={
                                    closeNotification
                                }
                                className="
                                    absolute
                                    right-3
                                    top-3
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-ink-400
                                    transition
                                    hover:bg-ink-100
                                    hover:text-ink-700
                                    dark:hover:bg-ink-800
                                    dark:hover:text-white
                                "
                                aria-label="Close notification"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* 
                            |--------------------------------------------------------------------------
                            | 15 Second Progress Bar
                            |--------------------------------------------------------------------------
                            */}

                            <motion.div
                                initial={{
                                    width: "100%",
                                }}
                                animate={{
                                    width: "0%",
                                }}
                                transition={{
                                    duration: 15,
                                    ease: "linear",
                                }}
                                className={`
                                    absolute
                                    bottom-0
                                    left-0
                                    h-[3px]
                                    ${notification.type ===
                                        "success"
                                        ? "bg-emerald-500"
                                        : "bg-red-500"
                                    }
                                `}
                            />
                        </div>
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
                className="mb-8"
            >
                <Link
                    to="/provider"
                    className="
                        mb-4
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        font-medium
                        text-ink-500
                        transition-colors
                        hover:text-primary-600
                        dark:text-ink-400
                        dark:hover:text-primary-400
                    "
                >
                    <ArrowLeft className="h-4 w-4" />

                    Back to dashboard
                </Link>

                <h1
                    className="
                        font-display
                        text-2xl
                        font-bold
                        tracking-tight
                        text-ink-900
                        dark:text-white
                        sm:text-3xl
                    "
                >
                    My Profile
                </h1>

                <p
                    className="
                        mt-1
                        text-sm
                        text-ink-500
                        dark:text-ink-400
                    "
                >
                    Manage your public provider profile
                    and how customers see you.
                </p>
            </motion.div>

            {/* 
            |--------------------------------------------------------------------------
            | PROFILE CARD
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
                }}
                className="
                    relative
                    max-w-4xl
                    overflow-hidden
                    rounded-3xl
                    border
                    border-ink-200/70
                    bg-white
                    shadow-sm
                    dark:border-ink-800
                    dark:bg-ink-900
                "
            >
                <div
                    className="
                        pointer-events-none
                        absolute
                        -right-24
                        -top-24
                        h-64
                        w-64
                        rounded-full
                        bg-primary-500/10
                        blur-3xl
                    "
                />

                <div className="relative">
                    {/* 
                    |--------------------------------------------------------------------------
                    | PROFILE HERO
                    |--------------------------------------------------------------------------
                    */}

                    <div
                        className="
                            border-b
                            border-ink-100
                            bg-gradient-to-br
                            from-primary-50/80
                            via-white
                            to-accent-50/50
                            p-6
                            dark:border-ink-800
                            dark:from-primary-950/30
                            dark:via-ink-900
                            dark:to-accent-950/20
                            sm:p-8
                        "
                    >
                        <div
                            className="
                                flex
                                flex-col
                                gap-6
                                sm:flex-row
                                sm:items-center
                            "
                        >
                            {/* 
                            |--------------------------------------------------------------------------
                            | PROFILE IMAGE
                            |--------------------------------------------------------------------------
                            */}

                            <div className="relative mx-auto sm:mx-0">
                                <div
                                    className="
                                        rounded-full
                                        bg-gradient-to-br
                                        from-primary-500
                                        via-primary-400
                                        to-accent-500
                                        p-[3px]
                                        shadow-xl
                                        shadow-primary-500/20
                                    "
                                >
                                    <div
                                        className="
                                            rounded-full
                                            bg-white
                                            p-[4px]
                                            dark:bg-ink-900
                                        "
                                    >
                                        <div
                                            className="
                                                group
                                                relative
                                                h-28
                                                w-28
                                                overflow-hidden
                                                rounded-full
                                                sm:h-32
                                                sm:w-32
                                            "
                                        >
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt={displayName || "Provider profile"}
                                                    className="
                                                              h-full
                                                              w-full
                                                              object-cover
                                                              transition
                                                              duration-500
                                                              group-hover:scale-105
                                                            "
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = "none";
                                                        setProfileImage("");
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="
                                                                 flex
                                                                 h-full
                                                                 w-full
                                                                 items-center
                                                                 justify-center
                                                                 bg-gradient-to-br
                                                                 from-primary-50
                                                                 to-ink-100
                                                                 text-primary-600
                                                                 dark:from-primary-950
                                                                 dark:to-ink-800
                                                                 dark:text-primary-400
                                                               "
                                                >
                                                    <User className="h-10 w-10" />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={
                                                    openImagePicker
                                                }
                                                className="
                                                    absolute
                                                    inset-0
                                                    flex
                                                    flex-col
                                                    items-center
                                                    justify-center
                                                    bg-black/0
                                                    text-white
                                                    opacity-0
                                                    transition-all
                                                    duration-300
                                                    group-hover:bg-black/45
                                                    group-hover:opacity-100
                                                "
                                            >
                                                <Camera className="mb-1 h-6 w-6" />

                                                <span className="text-xs font-semibold">
                                                    Change photo
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Online Indicator */}

                                <div
                                    className="
                                        absolute
                                        bottom-2
                                        right-2
                                        flex
                                        h-7
                                        w-7
                                        items-center
                                        justify-center
                                        rounded-full
                                        border-4
                                        border-white
                                        bg-emerald-500
                                        shadow-md
                                        dark:border-ink-900
                                    "
                                >
                                    <span className="h-2 w-2 rounded-full bg-white" />
                                </div>

                                {/* Camera Button */}

                                <button
                                    type="button"
                                    onClick={
                                        openImagePicker
                                    }
                                    className="
                                        absolute
                                        bottom-0
                                        left-0
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-full
                                        border-2
                                        border-white
                                        bg-primary-600
                                        text-white
                                        shadow-lg
                                        transition-all
                                        hover:scale-105
                                        hover:bg-primary-700
                                        dark:border-ink-900
                                    "
                                    aria-label="Change profile picture"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>

                                {/* Hidden File Input */}

                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={
                                        handleImageChange
                                    }
                                />
                            </div>

                            {/* 
                            |--------------------------------------------------------------------------
                            | PROVIDER INFORMATION
                            |--------------------------------------------------------------------------
                            */}

                            <div
                                className="
                                    min-w-0
                                    flex-1
                                    text-center
                                    sm:text-left
                                "
                            >
                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        justify-center
                                        gap-2
                                        sm:justify-start
                                    "
                                >
                                    <h2
                                        className="
                                            font-display
                                            text-2xl
                                            font-bold
                                            text-ink-900
                                            dark:text-white
                                        "
                                    >
                                        {displayName ||
                                            "Your Name"}
                                    </h2>

                                    {currentProvider?.verified && (
                                        <VerifiedBadge />
                                    )}
                                </div>

                                <p
                                    className="
                                        mt-2
                                        text-sm
                                        text-ink-500
                                        dark:text-ink-400
                                    "
                                >
                                    {currentProvider?.categories?.join(
                                        " • "
                                    ) ||
                                        "Service Provider"}
                                </p>

                                <div
                                    className="
                                        mt-3
                                        flex
                                        flex-wrap
                                        justify-center
                                        gap-2
                                        sm:justify-start
                                    "
                                >
                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-full
                                            bg-emerald-50
                                            px-3
                                            py-1
                                            text-xs
                                            font-semibold
                                            text-emerald-700
                                            dark:bg-emerald-950/40
                                            dark:text-emerald-400
                                        "
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />

                                        Available
                                    </span>

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-full
                                            bg-ink-100
                                            px-3
                                            py-1
                                            text-xs
                                            font-medium
                                            text-ink-600
                                            dark:bg-ink-800
                                            dark:text-ink-300
                                        "
                                    >
                                        <MapPin className="h-3.5 w-3.5" />

                                        {location ||
                                            "Location not set"}
                                    </span>
                                </div>

                                <p
                                    className="
                                        mt-4
                                        text-xs
                                        text-ink-400
                                    "
                                >
                                    Complete your profile
                                    details before adding a
                                    profile picture.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 
                    |--------------------------------------------------------------------------
                    | FORM
                    |--------------------------------------------------------------------------
                    */}

                    <div className="p-6 sm:p-8">
                        <div className="mb-6">
                            <h3
                                className="
                                    font-display
                                    text-lg
                                    font-bold
                                    text-ink-900
                                    dark:text-white
                                "
                            >
                                Profile Information
                            </h3>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-ink-500
                                    dark:text-ink-400
                                "
                            >
                                Keep your information accurate
                                so customers know who they are
                                booking.
                            </p>
                        </div>

                        <div
                            className="
                                grid
                                grid-cols-1
                                gap-5
                                sm:grid-cols-2
                            "
                        >
                            {/* 
                            |--------------------------------------------------------------------------
                            | DISPLAY NAME
                            |--------------------------------------------------------------------------
                            */}

                            <div>
                                <label className="label">
                                    Display Name
                                </label>

                                <div className="relative">
                                    <User
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-3
                                            top-1/2
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-ink-400
                                        "
                                    />

                                    <input
                                        className="
                                            input
                                            cursor-not-allowed
                                            bg-ink-50
                                            pl-10
                                            dark:bg-ink-800/60
                                        "
                                        value={
                                            displayName
                                        }
                                        disabled
                                    />
                                </div>
                            </div>

                            {/* 
                            |--------------------------------------------------------------------------
                            | EMAIL
                            |--------------------------------------------------------------------------
                            */}

                            <div>
                                <label className="label">
                                    Email
                                </label>

                                <div className="relative">
                                    <Mail
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-3
                                            top-1/2
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-ink-400
                                        "
                                    />

                                    <input
                                        className="
                                            input
                                            cursor-not-allowed
                                            bg-ink-50
                                            pl-10
                                            dark:bg-ink-800/60
                                        "
                                        value={
                                            user?.email ||
                                            ""
                                        }
                                        disabled
                                    />
                                </div>
                            </div>

                            {/* 
                            |--------------------------------------------------------------------------
                            | ABOUT
                            |--------------------------------------------------------------------------
                            */}

                            <div className="sm:col-span-2">
                                <label className="label">
                                    About

                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <textarea
                                    className="
                                        form-textarea
                                        min-h-[130px]
                                        resize-none
                                    "
                                    value={about}
                                    onChange={(
                                        event
                                    ) => {
                                        const value =
                                            event.target
                                                .value;

                                        if (
                                            value.length <=
                                            500
                                        ) {
                                            setAbout(
                                                value
                                            );
                                        }
                                    }}
                                    placeholder="Tell customers about yourself, your experience and the services you provide..."
                                    maxLength={500}
                                />

                                <p
                                    className="
                                        mt-1.5
                                        text-right
                                        text-[11px]
                                        text-ink-400
                                    "
                                >
                                    {about.length}/500
                                </p>
                            </div>

                            {/* 
                            |--------------------------------------------------------------------------
                            | LOCATION
                            |--------------------------------------------------------------------------
                            */}

                            <div>
                                <label className="label">
                                    Location

                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <MapPin
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-3
                                            top-1/2
                                            z-10
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-ink-400
                                        "
                                    />

                                    <select
                                        className="
                                            input
                                            cursor-pointer
                                            appearance-none
                                            pl-10
                                            pr-10
                                        "
                                        value={location}
                                        onChange={(
                                            event
                                        ) => {
                                            setLocation(
                                                event.target
                                                    .value
                                            );
                                        }}
                                    >
                                        <option value="">
                                            Select your location
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

                                    <ChevronDown
                                        className="
                                            pointer-events-none
                                            absolute
                                            right-3
                                            top-1/2
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-ink-400
                                        "
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 
                        |--------------------------------------------------------------------------
                        | PHOTO TIP
                        |--------------------------------------------------------------------------
                        */}

                        <div
                            className="
                                mt-6
                                flex
                                items-start
                                gap-3
                                rounded-2xl
                                border
                                border-primary-100
                                bg-primary-50/60
                                p-4
                                dark:border-primary-900/50
                                dark:bg-primary-950/20
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-white
                                    text-primary-600
                                    shadow-sm
                                    dark:bg-ink-800
                                    dark:text-primary-400
                                "
                            >
                                <ImageIcon className="h-4 w-4" />
                            </div>

                            <div>
                                <p
                                    className="
                                        text-sm
                                        font-semibold
                                        text-ink-800
                                        dark:text-ink-200
                                    "
                                >
                                    Profile photo tip
                                </p>

                                <p
                                    className="
                                        mt-0.5
                                        text-xs
                                        leading-5
                                        text-ink-500
                                        dark:text-ink-400
                                    "
                                >
                                    Complete your About and
                                    Location first. Then add a
                                    clear, professional image
                                    where your face is visible.
                                    JPG, PNG and WebP images up
                                    to 5MB are supported.
                                </p>
                            </div>
                        </div>

                        {/* 
                        |--------------------------------------------------------------------------
                        | SAVE
                        |--------------------------------------------------------------------------
                        */}

                        <div
                            className="
                                mt-7
                                flex
                                flex-col-reverse
                                gap-3
                                border-t
                                border-ink-100
                                pt-6
                                sm:flex-row
                                sm:items-center
                                sm:justify-end
                                dark:border-ink-800
                            "
                        >
                            <button
                                type="button"
                                onClick={
                                    handleSave
                                }
                                disabled={
                                    isSaving
                                }
                                className="
                                    group
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-gradient-to-r
                                    from-primary-600
                                    to-primary-500
                                    px-5
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-white
                                    shadow-lg
                                    shadow-primary-500/20
                                    transition-all
                                    duration-200
                                    hover:-translate-y-0.5
                                    hover:shadow-xl
                                    hover:shadow-primary-500/25
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                    disabled:hover:translate-y-0
                                "
                            >
                                {isSaving ? (
                                    <>
                                        <span
                                            className="
                                                h-4
                                                w-4
                                                animate-spin
                                                rounded-full
                                                border-2
                                                border-white/30
                                                border-t-white
                                            "
                                        />

                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />

                                        Save Changes

                                        <ArrowRight
                                            className="
                                                h-4
                                                w-4
                                                transition-transform
                                                group-hover:translate-x-1
                                            "
                                        />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}