import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Palette,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';

import {
  DashboardLayout,
  DashboardHeader,
} from '@/components/DashboardLayout';
import { customerNavItems } from '@/data/customerNavItems';
import { useAuth } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, Badge, Button, Card, cn } from '@/components/ui';

/* =========================================================
   SHARED SETTINGS PIECES
========================================================= */

function SettingRow({
  icon: Icon,
  title,
  description,
  control,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
            {title}
          </p>

          {description && (
            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ink-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 sm:text-right">{control}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        checked
          ? 'bg-brand-600'
          : 'bg-slate-300 dark:bg-ink-700'
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function SettingsCardHeader({
  icon: Icon,
  title,
  description,
  tone = 'brand',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: 'brand' | 'danger';
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          tone === 'danger'
            ? 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200'
            : 'bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <h2
          className={cn(
            'text-sm font-semibold',
            tone === 'danger'
              ? 'text-danger-700 dark:text-danger-200'
              : 'text-slate-900 dark:text-ink-50'
          )}
        >
          {title}
        </h2>

        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER PROFILE (/customer/profile)
========================================================= */

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function CustomerProfile() {
  const { user, updateProfile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<string>(user?.avatar ?? '');

  const [name, setName] = useState(user?.name ?? '');
  const [about, setAbout] = useState(user?.about ?? '');
  const [location, setLocation] = useState(user?.location ?? '');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(previewRef.current);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Swap the visible avatar and revoke any previous object URL.
   */
  const applyPreview = (url: string) => {
    if (previewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewRef.current);
    }

    previewRef.current = url;
    setPreview(url);
  };

  /*
   * Keep the form aligned with the authenticated user
   * (session restore, or a profile saved elsewhere).
   */
  useEffect(() => {
    if (!user) return;

    setName(user.name || '');
    setAbout(user.about ?? '');
    setLocation(user.location ?? '');

    if (!selectedFile) {
      applyPreview(user.avatar ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /*
   * Release the pending preview blob on unmount.
   */
  useEffect(() => {
    return () => {
      if (previewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError('Please choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Please choose an image smaller than 5MB.');
      event.target.value = '';
      return;
    }

    setFormError('');
    setSelectedFile(file);
    applyPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Please enter your name.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const data = await updateProfile({
        name: name.trim(),
        about: about.trim(),
        location: location.trim(),
        avatar: selectedFile,
      });

      if (data?.user) {
        setName(data.user.name || name.trim());
        setAbout(data.user.about ?? about.trim());
        setLocation(data.user.location ?? location.trim());

        if (data.user.avatar) {
          applyPreview(data.user.avatar);
        }
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccessMessage('Your profile has been updated successfully.');

      setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (error) {
      console.error('Profile update error:', error);

      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const initial = user?.name?.[0] || 'U';

  return (
    <DashboardLayout role="customer" navItems={customerNavItems}>
      <DashboardHeader
        title="My Profile"
        subtitle="Manage your personal information"
      />

      <div className="space-y-5">
        {/* Success feedback */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              role="status"
              className="flex items-center gap-3 rounded-2xl border border-success-100 bg-success-50 p-4 text-sm font-medium text-success-700 shadow-card dark:border-success-600/30 dark:bg-success-600/10 dark:text-success-200"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error feedback */}
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex-1">{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* =================================================
              AVATAR CARD
          ================================================= */}
          <Card className="h-fit lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-lavender ring-4 ring-white dark:bg-brand-950 dark:ring-ink-800">
                  {preview ? (
                    <img
                      src={preview}
                      alt={name || 'Profile photo'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-semibold text-brand-600 dark:text-brand-300">
                      {initial.toUpperCase()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-soft transition hover:bg-brand-700 dark:border-ink-900"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                className="sr-only"
                onChange={handleFileChange}
                aria-label="Upload a new profile photo"
              />

              <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-ink-50">
                {user?.name}
              </h2>

              <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">
                {user?.email}
              </p>

              <div className="mt-3">
                <Badge tone="brand">Customer account</Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Camera}
                className="mt-4 w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </Button>

              {selectedFile ? (
                <p className="mt-3 text-xs font-medium text-warning-600 dark:text-warning-200">
                  New photo selected — save your changes to upload it.
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-400 dark:text-ink-500">
                  JPG, PNG or WebP · max 5MB
                </p>
              )}
            </div>
          </Card>

          {/* =================================================
              DETAILS FORM CARD
          ================================================= */}
          <Card className="lg:col-span-2">
            <div className="border-b border-slate-100 pb-4 dark:border-ink-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                Personal details
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                This information is visible to providers you book.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="label">
                  Full name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="profile-location" className="label">
                  Location
                </label>
                <input
                  id="profile-location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Add your location"
                  autoComplete="address-level2"
                  className="input"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="profile-about" className="label">
                  About
                </label>
                <textarea
                  id="profile-about"
                  value={about}
                  onChange={(event) =>
                    setAbout(event.target.value.slice(0, 500))
                  }
                  rows={4}
                  maxLength={500}
                  placeholder="Tell providers a little about yourself..."
                  className="form-textarea"
                />
                <p className="mt-1 text-right text-xs text-slate-400 dark:text-ink-500">
                  {about.length}/500
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="profile-email" className="label">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  readOnly
                  className="input cursor-not-allowed opacity-60"
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-ink-500">
                  Your email can't be changed here.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5 dark:border-ink-800">
              <Button
                onClick={handleSave}
                loading={saving}
                icon={CheckCircle2}
                className="w-full sm:w-auto"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   CUSTOMER SETTINGS (/customer/settings)
========================================================= */

export function CustomerSettings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    bookingUpdates: true,
    providerMessages: true,
    promotionalEmails: true,
    newProviders: true,
  });

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const notificationRows: {
    key: keyof typeof notifications;
    icon: LucideIcon;
    title: string;
    description: string;
  }[] = [
    {
      key: 'bookingUpdates',
      icon: Bell,
      title: 'Booking updates',
      description: 'Status changes and confirmations for your bookings.',
    },
    {
      key: 'providerMessages',
      icon: MessageSquare,
      title: 'Provider messages',
      description: 'Replies from the providers you have booked.',
    },
    {
      key: 'promotionalEmails',
      icon: Mail,
      title: 'Promotional emails',
      description: 'Offers and highlights from Servicely.',
    },
    {
      key: 'newProviders',
      icon: Sparkles,
      title: 'New providers in your area',
      description: 'When new providers join near you.',
    },
  ];

  return (
    <DashboardLayout role="customer" navItems={customerNavItems}>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your account preferences"
      />

      <div className="max-w-3xl space-y-6">
        {/* =================================================
            APPEARANCE
        ================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <SettingsCardHeader
              icon={Palette}
              title="Appearance"
              description="Choose how Servicely looks on this device"
            />

            <div className="mt-2 divide-y divide-slate-100 dark:divide-ink-800">
              <SettingRow
                icon={theme === 'dark' ? Moon : Sun}
                title="Theme"
                description={
                  theme === 'dark'
                    ? 'Dark mode reduces glare in low light.'
                    : 'Light mode is easier on the eyes in daylight.'
                }
                control={
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>

                    <ToggleSwitch
                      checked={theme === 'dark'}
                      onChange={() => toggleTheme()}
                      label="Toggle dark mode"
                    />
                  </div>
                }
              />
            </div>
          </Card>
        </motion.div>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card>
            <SettingsCardHeader
              icon={Bell}
              title="Notifications"
              description="Decide what Servicely keeps you updated about"
            />

            <div className="mt-2 divide-y divide-slate-100 dark:divide-ink-800">
              {notificationRows.map((row) => (
                <SettingRow
                  key={row.key}
                  icon={row.icon}
                  title={row.title}
                  description={row.description}
                  control={
                    <ToggleSwitch
                      checked={notifications[row.key]}
                      onChange={(value) =>
                        setNotifications((previous) => ({
                          ...previous,
                          [row.key]: value,
                        }))
                      }
                      label={`Toggle ${row.title}`}
                    />
                  }
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* =================================================
            SECURITY
        ================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <SettingsCardHeader
              icon={Lock}
              title="Security"
              description="Keep your account safe"
            />

            <div className="mt-2 divide-y divide-slate-100 dark:divide-ink-800">
              <SettingRow
                icon={Lock}
                title="Password"
                description="Update the password you use to sign in."
                control={
                  <Button variant="outline" size="sm" type="button">
                    Change password
                  </Button>
                }
              />

              <SettingRow
                icon={Mail}
                title="Email address"
                description={user?.email}
                control={
                  <span className="badge bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                    Sign-in email
                  </span>
                }
              />
            </div>
          </Card>
        </motion.div>

        {/* =================================================
            DANGER ZONE
        ================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-2xl border border-danger-100 bg-white p-5 shadow-card dark:border-danger-500/20 dark:bg-ink-900"
        >
          <SettingsCardHeader
            icon={AlertCircle}
            title="Danger zone"
            description="Actions here affect your current session"
            tone="danger"
          />

          <div className="mt-2 divide-y divide-slate-100 dark:divide-ink-800">
            <SettingRow
              icon={LogOut}
              title="Log out"
              description="Sign out of your account on this device."
              control={
                <Button
                  variant="danger"
                  size="sm"
                  icon={LogOut}
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              }
            />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
