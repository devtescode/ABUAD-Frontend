import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckCircle2,
  Tag,
  Calendar,
  CreditCard,
  Star,
  AlertTriangle,
  Award,
  BarChart3,
  Settings,
} from 'lucide-react';

export const adminNavItems = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    label: 'Users',
    icon: Users,
    path: '/admin/users',
  },
  {
    label: 'Providers',
    icon: Briefcase,
    path: '/admin/providers',
  },
  {
    label: 'Verification',
    icon: CheckCircle2,
    path: '/admin/verification',
  },
  {
    label: 'Categories',
    icon: Tag,
    path: '/admin/categories',
  },
  {
    label: 'Bookings',
    icon: Calendar,
    path: '/admin/bookings',
  },
  {
    label: 'Payments',
    icon: CreditCard,
    path: '/admin/payments',
  },
  {
    label: 'Reviews',
    icon: Star,
    path: '/admin/reviews',
  },
  {
    label: 'Disputes',
    icon: AlertTriangle,
    path: '/admin/disputes',
  },
  {
    label: 'Featured',
    icon: Award,
    path: '/admin/featured',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings',
  },
];