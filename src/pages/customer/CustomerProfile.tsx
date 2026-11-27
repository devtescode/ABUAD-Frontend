/**
 * Customer profile page (/customer/profile).
 *
 * Owns all editable state and persistence for the customer account while the
 * presentational pieces live in `./profile`. The avatar file is kept as a
 * pending selection until "Save changes" is pressed, so a customer can preview
 * a new photo without committing it to the backend.
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';

import {
  DashboardHeader,
  DashboardLayout,
} from '@/components/DashboardLayout';
import { useAuth } from '@/context/AppContext';
import { customerNavItems } from '@/data/customerNavItems';
import { getApiErrorMessage } from '@/lib/api';
import {
  ABOUT_MAX_LENGTH,
  AccountCard,
  ProfileForm,
  ProfileHero,
  ProfileStrength,
  useAvatarUpload,
  type ProfileFormValues,
} from '@/pages/customer/profile';

const GENERIC_API_ERROR = 'Something went wrong. Please try again.';

type UpdatedCustomer = {
  name?: string | null;
  about?: string | null;
  location?: string | null;
  avatar?: string | null;
};

export function CustomerProfile() {
  const { user, updateCustomerProfile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [about, setAbout] = useState(user?.about ?? '');
  const [location, setLocation] = useState(user?.location ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const avatarUpload = useAvatarUpload(user?.avatar);

  // Keep the form aligned with the authenticated user (session restore or a
  // profile saved from another tab). The hook handles pending avatar files.
  useEffect(() => {
    if (!user) return;

    setName(user.name ?? '');
    setAbout(user.about ?? '');
    setLocation(user.location ?? '');
  }, [user]);

  // Never leave a pending success banner timer running after navigation.
  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    []
  );

  const clearSuccess = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setSuccess('');
  };

  const showSuccess = (message: string) => {
    clearSuccess();
    setSuccess(message);
    successTimerRef.current = setTimeout(() => {
      setSuccess('');
      successTimerRef.current = null;
    }, 3500);
  };

  const handleFieldChange = (
    field: keyof ProfileFormValues,
    value: string
  ) => {
    clearSuccess();
    setError('');

    if (field === 'name') setName(value);
    if (field === 'about') setAbout(value);
    if (field === 'location') setLocation(value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    avatarUpload.selectFile(event.target.files?.[0] ?? null);
    // Allow selecting the same file again after a removal or a failed save.
    event.target.value = '';
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    avatarUpload.clear();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    avatarUpload.selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (about.trim().length > ABOUT_MAX_LENGTH) {
      setError(`Your bio must be ${ABOUT_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setSaving(true);
    setError('');
    clearSuccess();

    try {
      const data = await updateCustomerProfile({
        name: name.trim(),
        about: about.trim(),
        location: location.trim(),
        avatar: avatarUpload.file,
      });

      const updatedUser = data?.user as UpdatedCustomer | undefined;

      if (updatedUser) {
        setName(updatedUser.name ?? name.trim());
        setAbout(updatedUser.about ?? about.trim());
        setLocation(updatedUser.location ?? location.trim());

        // Publish the new URL before clearing so the blob preview is replaced
        // with the Cloudinary URL instead of reverting to the old avatar.
        avatarUpload.syncExternalUrl(updatedUser.avatar);
        avatarUpload.clear();
      }

      if (fileInputRef.current) fileInputRef.current.value = '';

      showSuccess('Your profile has been updated successfully.');
    } catch (err) {
      console.error('Customer profile save error:', err);

      const apiMessage = getApiErrorMessage(err);
      const fallbackMessage = (err as { message?: string } | null)?.message;
      setError(
        apiMessage && apiMessage !== GENERIC_API_ERROR
          ? apiMessage
          : fallbackMessage || 'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const formValues: ProfileFormValues = { name, about, location };

  const dirty =
    name.trim() !== (user?.name ?? '').trim() ||
    about.trim() !== (user?.about ?? '').trim() ||
    location.trim() !== (user?.location ?? '').trim() ||
    Boolean(avatarUpload.file);

  const hasAvatar = Boolean(user?.avatar) || Boolean(avatarUpload.file);

  if (!user) {
    return (
      <DashboardLayout role="customer" navItems={customerNavItems}>
        <DashboardHeader
          title="My Profile"
          subtitle="Manage how your account appears across Servicely"
        />

        <div className="flex min-h-[55vh] items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-card dark:border-brand-900/60 dark:bg-ink-900 dark:text-ink-300"
          >
            <Loader2
              aria-hidden="true"
              className="h-5 w-5 animate-spin text-brand-600 dark:text-lime-300"
            />
            Loading your profile…
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="customer" navItems={customerNavItems}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-6"
      >
        <DashboardHeader
          title="My Profile"
          subtitle="Manage how your account appears across Servicely"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload a new profile photo"
          onChange={handleFileChange}
        />

        <ProfileHero
          name={name}
          email={user.email}
          hasAvatar={Boolean(user.avatar)}
          previewUrl={avatarUpload.previewUrl}
          selectedFileName={avatarUpload.file?.name ?? null}
          error={avatarUpload.error}
          isDragging={isDragging}
          onPickFile={handlePickFile}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onRemoveFile={handleRemoveFile}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <ProfileStrength
              name={name}
              about={about}
              location={location}
              hasAvatar={hasAvatar}
            />

            <AccountCard
              email={user.email}
              matricNo={user.matricNo}
              phoneNumber={user.phoneNumber}
              gender={user.gender}
              role={user.role}
              status={user.status}
            />
          </div>

          <ProfileForm
            values={formValues}
            onChange={handleFieldChange}
            onSubmit={handleSave}
            saving={saving}
            dirty={dirty}
            error={error}
            success={success}
            email={user.email}
            matricNo={user.matricNo}
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs leading-5 text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-200">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-lime-300"
          />
          <p>
            <span className="font-semibold">Your privacy matters.</span> Your
            photo and profile details are only shared with providers you choose
            to book.
          </p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

export default CustomerProfile;
