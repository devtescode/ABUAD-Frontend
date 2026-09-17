import { Home, Package, Plus, Image, Calendar, Inbox, ClipboardList, DollarSign, Star, User, Settings, DollarSign as Money, ArrowRight, Trash2, Edit, Eye } from 'lucide-react';

export const providerNavItems = [
  { label: 'Overview', icon: Home, path: '/provider' },
  { label: 'My Services', icon: Package, path: '/provider/services' },
  { label: 'Add Service', icon: Plus, path: '/provider/add-service' },
  { label: 'Portfolio', icon: Image, path: '/provider/portfolio' },
  { label: 'Availability', icon: Calendar, path: '/provider/availability' },
  { label: 'Booking Requests', icon: Inbox, path: '/provider/requests' },
  { label: 'My Bookings', icon: ClipboardList, path: '/provider/bookings' },
  { label: 'Earnings', icon: DollarSign, path: '/provider/earnings' },
  { label: 'Reviews', icon: Star, path: '/provider/reviews' },
  { label: 'My Profile', icon: User, path: '/provider/profile' },
  { label: 'Settings', icon: Settings, path: '/provider/settings' },
];