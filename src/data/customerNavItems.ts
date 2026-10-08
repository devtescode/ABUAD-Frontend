
import { Home, Search, Heart, Calendar, Star, User, Settings} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { ProviderCard, StatusBadge } from '@/components/shared';
import { useAuth, useBookings } from '@/context/AppContext';
import { providers, formatNaira } from '@/data/mockData';

export const customerNavItems = [
  { label: 'Overview', icon: Home, path: '/customer' },
  { label: 'Browse Services', icon: Search, path: '/customer/browse' },
  { label: 'Saved Providers', icon: Heart, path: '/customer/saved' },
  { label: 'My Bookings', icon: Calendar, path: '/customer/bookings' },
  { label: 'My Reviews', icon: Star, path: '/customer/reviews' },
  { label: 'Profile', icon: User, path: '/customer/profile' },
  { label: 'Settings', icon: Settings, path: '/customer/settings' },
];