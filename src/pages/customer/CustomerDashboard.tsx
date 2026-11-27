import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Lock,
  LogOut,
  Mail,
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
import { Button, Card, cn } from '@/components/ui';

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

/* =========================================================
   BACKWARDS-COMPATIBILITY RE-EXPORT
========================================================= */

export { CustomerProfile } from '@/pages/customer/CustomerProfile';
