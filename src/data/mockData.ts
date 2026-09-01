import type { LucideIcon } from 'lucide-react';
import { Camera, Video, Palette, Sparkles } from 'lucide-react';

export type UserRole = 'customer' | 'provider' | 'admin';

export type ProviderStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'payment_pending'
  | 'paid'
  | 'completed'
  | 'reviewed'
  | 'rejected'
  | 'cancelled'
  | 'disputed';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  image: string;
  color: string;
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  price: number;
  duration: string;
  description: string;
  category: string;
  image: string;
  active: boolean;
}

export interface PortfolioItem {
  id: string;
  providerId: string;
  title: string;
  category: string;
  image: string;
}

export interface Review {
  id: string;
  bookingId: string;
  providerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Provider {
  id: string;
  name: string;
  avatar: string;
  categories: string[];
  about: string;
  rating: number;
  reviewCount: number;
  completedBookings: number;
  startingPrice: number;
  location: string;
  status: ProviderStatus;
  verified: boolean;
  featured: boolean;
  portfolio: PortfolioItem[];
  services: Service[];
  availability: AvailabilityDay[];
  joinedDate: string;
}

export interface AvailabilityDay {
  day: string;
  available: boolean;
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  customerName: string;
  date: string;
  time: string;
  location: string;
  price: number;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'Photography',
    slug: 'photography',
    icon: Camera,
    description: 'Capture every moment with professional photographers.',
    image: 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: '2',
    name: 'Videography',
    slug: 'videography',
    icon: Video,
    description: 'Cinematic video production for any occasion.',
    image: 'https://images.pexels.com/photos/313567/pexels-photo-313567.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'from-sky-400 to-blue-600',
  },
  {
    id: '3',
    name: 'Graphic Design',
    slug: 'graphic-design',
    icon: Palette,
    description: 'Stunning visuals, logos, and branding materials.',
    image: 'https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'from-rose-400 to-pink-600',
  },
  {
    id: '4',
    name: 'Makeup',
    slug: 'makeup',
    icon: Sparkles,
    description: 'Professional makeup artistry for any event.',
    image: 'https://images.pexels.com/photos/3373738/pexels-photo-3373738.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'from-fuchsia-400 to-purple-500',
  },
];

const portfolioImages = {
  photography: [
    'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1689254/pexels-photo-1689254.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  videography: [
    'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  design: [
    'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3781339/pexels-photo-3781339.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  makeup: [
    'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3373745/pexels-photo-3373745.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
};

const defaultAvailability: AvailabilityDay[] = [
  { day: 'Monday', available: true, start: '10:00', end: '17:00' },
  { day: 'Tuesday', available: true, start: '10:00', end: '17:00' },
  { day: 'Wednesday', available: true, start: '12:00', end: '18:00' },
  { day: 'Thursday', available: true, start: '10:00', end: '17:00' },
  { day: 'Friday', available: true, start: '10:00', end: '19:00' },
  { day: 'Saturday', available: true, start: '09:00', end: '16:00' },
  { day: 'Sunday', available: false, start: '', end: '' },
];

export const providers: Provider[] = [
  {
    id: 'p1',
    name: 'Daniel Okonkwo',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Photography'],
    about:
      'Award-winning photographer specializing in birthday shoots, graduation photos, and portraits. I bring creativity and professionalism to every session, ensuring you get images you will treasure forever.',
    rating: 4.9,
    reviewCount: 57,
    completedBookings: 57,
    startingPrice: 30000,
    location: 'ABUAD Campus, Ado-Ekiti',
    status: 'verified',
    verified: true,
    featured: true,
    joinedDate: '2024-09-15',
    availability: defaultAvailability,
    portfolio: [
      { id: 'po1', providerId: 'p1', title: 'Birthday Shoot', category: 'Photography', image: portfolioImages.photography[0] },
      { id: 'po2', providerId: 'p1', title: 'Graduation Portrait', category: 'Photography', image: portfolioImages.photography[1] },
      { id: 'po3', providerId: 'p1', title: 'Event Coverage', category: 'Photography', image: portfolioImages.photography[2] },
      { id: 'po4', providerId: 'p1', title: 'Studio Portrait', category: 'Photography', image: portfolioImages.photography[3] },
    ],
    services: [
      { id: 's1', providerId: 'p1', title: 'Birthday Photography', price: 30000, duration: '2 hours', description: 'Professional birthday photography with edited images delivered within 48 hours.', category: 'Photography', image: portfolioImages.photography[0], active: true },
      { id: 's2', providerId: 'p1', title: 'Graduation Photos', price: 25000, duration: '1.5 hours', description: 'Celebrate your milestone with stunning graduation portraits.', category: 'Photography', image: portfolioImages.photography[1], active: true },
      { id: 's3', providerId: 'p1', title: 'Event Coverage', price: 80000, duration: '4 hours', description: 'Full event coverage with 100+ edited images.', category: 'Photography', image: portfolioImages.photography[2], active: true },
    ],
  },
  {
    id: 'p2',
    name: 'Sarah Adeyemi',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Makeup'],
    about:
      'Professional makeup artist with 5+ years of experience. Specializing in bridal makeup, party glam, and natural looks that enhance your beauty for any occasion.',
    rating: 5.0,
    reviewCount: 42,
    completedBookings: 42,
    startingPrice: 15000,
    location: 'ABUAD Campus, Ado-Ekiti',
    status: 'verified',
    verified: true,
    featured: true,
    joinedDate: '2024-08-20',
    availability: defaultAvailability,
    portfolio: [
      { id: 'po5', providerId: 'p2', title: 'Bridal Glam', category: 'Makeup', image: portfolioImages.makeup[0] },
      { id: 'po6', providerId: 'p2', title: 'Party Look', category: 'Makeup', image: portfolioImages.makeup[1] },
    ],
    services: [
      { id: 's4', providerId: 'p2', title: 'Bridal Makeup', price: 45000, duration: '2 hours', description: 'Complete bridal makeup package with touch-up kit included.', category: 'Makeup', image: portfolioImages.makeup[0], active: true },
      { id: 's5', providerId: 'p2', title: 'Party Glam', price: 15000, duration: '1 hour', description: 'Glamorous party makeup look tailored to your outfit.', category: 'Makeup', image: portfolioImages.makeup[1], active: true },
    ],
  },
  {
    id: 'p3',
    name: 'Michael Eze',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Videography'],
    about:
      'Cinematic videographer creating stunning visual stories. From weddings to music videos and corporate events, I deliver high-quality video production that captures the emotion of every moment.',
    rating: 4.8,
    reviewCount: 34,
    completedBookings: 34,
    startingPrice: 50000,
    location: 'ABUAD Campus, Ado-Ekiti',
    status: 'verified',
    verified: true,
    featured: true,
    joinedDate: '2024-10-01',
    availability: defaultAvailability,
    portfolio: [
      { id: 'po7', providerId: 'p3', title: 'Wedding Film', category: 'Videography', image: portfolioImages.videography[0] },
      { id: 'po8', providerId: 'p3', title: 'Event Highlight', category: 'Videography', image: portfolioImages.videography[1] },
    ],
    services: [
      { id: 's6', providerId: 'p3', title: 'Event Videography', price: 50000, duration: '4 hours', description: 'Professional event coverage with cinematic editing and color grading.', category: 'Videography', image: portfolioImages.videography[0], active: true },
      { id: 's7', providerId: 'p3', title: 'Promo Video', price: 35000, duration: '2 hours', description: 'Promotional video for your brand or product with motion graphics.', category: 'Videography', image: portfolioImages.videography[1], active: true },
    ],
  },
  {
    id: 'p4',
    name: 'Grace Okafor',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Graphic Design'],
    about:
      'Creative graphic designer with a passion for branding and visual identity. I help businesses and individuals stand out with professional logos, flyers, and social media designs.',
    rating: 4.7,
    reviewCount: 28,
    completedBookings: 28,
    startingPrice: 10000,
    location: 'ABUAD Campus, Ado-Ekiti',
    status: 'verified',
    verified: true,
    featured: false,
    joinedDate: '2024-11-05',
    availability: defaultAvailability,
    portfolio: [
      { id: 'po9', providerId: 'p4', title: 'Logo Design', category: 'Graphic Design', image: portfolioImages.design[0] },
      { id: 'po10', providerId: 'p4', title: 'Flyer Design', category: 'Graphic Design', image: portfolioImages.design[1] },
    ],
    services: [
      { id: 's8', providerId: 'p4', title: 'Logo Design', price: 10000, duration: '3 days', description: 'Custom logo design with 3 concepts and unlimited revisions.', category: 'Graphic Design', image: portfolioImages.design[0], active: true },
      { id: 's9', providerId: 'p4', title: 'Flyer Design', price: 5000, duration: '1 day', description: 'Eye-catching flyer design for your event or business.', category: 'Graphic Design', image: portfolioImages.design[1], active: true },
    ],
  },
  {
    id: 'p5',
    name: 'Emmanuel Nwosu',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Photography', 'Videography'],
    about:
      'Multi-talented visual artist offering both photography and videography services. I bring a unique creative vision to every project, combining both mediums for the ultimate visual experience.',
    rating: 4.6,
    reviewCount: 19,
    completedBookings: 19,
    startingPrice: 20000,
    location: 'ABUAD Campus, Ado-Ekiti',
    status: 'verified',
    verified: true,
    featured: false,
    joinedDate: '2025-01-10',
    availability: defaultAvailability,
    portfolio: [
      { id: 'po11', providerId: 'p5', title: 'Portrait Session', category: 'Photography', image: portfolioImages.photography[0] },
      { id: 'po12', providerId: 'p5', title: 'Music Video', category: 'Videography', image: portfolioImages.videography[1] },
    ],
    services: [
      { id: 's10', providerId: 'p5', title: 'Portrait Session', price: 20000, duration: '1 hour', description: 'Professional portrait photography with 15 edited images.', category: 'Photography', image: portfolioImages.photography[0], active: true },
    ],
  },
  {
    id: 'p6',
    name: 'Blessing Adebayo',
    avatar: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=400',
    categories: ['Makeup'],
    about:
      'Certified makeup artist passionate about enhancing natural beauty. I specialize in everyday glam, soft glam, and editorial looks.',
    rating: 4.5,
    reviewCount: 12,
    completedBookings: 12,
    startingPrice: 8000,
    location: 'ABUAD Campus, Ado-Ekiti',
    status: 'pending',
    verified: false,
    featured: false,
    joinedDate: '2025-02-01',
    availability: defaultAvailability,
    portfolio: [
      { id: 'po13', providerId: 'p6', title: 'Soft Glam', category: 'Makeup', image: portfolioImages.makeup[0] },
    ],
    services: [
      { id: 's11', providerId: 'p6', title: 'Soft Glam', price: 8000, duration: '45 mins', description: 'Natural soft glam makeup perfect for dates and casual events.', category: 'Makeup', image: portfolioImages.makeup[0], active: true },
    ],
  },
];

export const reviews: Review[] = [
  { id: 'r1', bookingId: 'b1', providerId: 'p1', customerName: 'Chioma O.', rating: 5, comment: 'Amazing photographer! The photos came out better than I expected. Highly recommend!', date: '2025-02-15' },
  { id: 'r2', bookingId: 'b2', providerId: 'p1', customerName: 'Tunde A.', rating: 5, comment: 'Professional and creative. Daniel made the whole experience fun and relaxed.', date: '2025-02-10' },
  { id: 'r3', bookingId: 'b3', providerId: 'p2', customerName: 'Fatima I.', rating: 5, comment: 'My bridal makeup was flawless! It lasted the entire day. Thank you Sarah!', date: '2025-01-28' },
  { id: 'r4', bookingId: 'b4', providerId: 'p3', customerName: 'Kunle B.', rating: 5, comment: 'The video quality was incredible. Michael captured every important moment.', date: '2025-02-05' },
  { id: 'r5', bookingId: 'b5', providerId: 'p4', customerName: 'Zainab M.', rating: 4, comment: 'Great logo design! Quick turnaround and very creative.', date: '2025-01-20' },
];

export const sampleBookings: Booking[] = [
  {
    id: 'b1',
    serviceId: 's1',
    serviceName: 'Birthday Photography',
    providerId: 'p1',
    providerName: 'Daniel Okonkwo',
    providerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    customerName: 'You',
    date: '2025-09-15',
    time: '14:00',
    location: 'ABUAD Cafeteria',
    price: 30000,
    notes: 'Please bring extra lighting equipment.',
    status: 'accepted',
    createdAt: '2025-08-28',
  },
  {
    id: 'b2',
    serviceId: 's4',
    serviceName: 'Bridal Makeup',
    providerId: 'p2',
    providerName: 'Sarah Adeyemi',
    providerAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    customerName: 'You',
    date: '2025-09-20',
    time: '10:00',
    location: 'Hall B, ABUAD',
    price: 45000,
    notes: '',
    status: 'payment_pending',
    createdAt: '2025-08-30',
  },
  {
    id: 'b3',
    serviceId: 's8',
    serviceName: 'Logo Design',
    providerId: 'p4',
    providerName: 'Grace Okafor',
    providerAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    customerName: 'You',
    date: '2025-08-10',
    time: '09:00',
    location: 'Online',
    price: 10000,
    notes: 'Need a modern minimalist logo.',
    status: 'completed',
    createdAt: '2025-08-01',
  },
  {
    id: 'b4',
    serviceId: 's6',
    serviceName: 'Event Videography',
    providerId: 'p3',
    providerName: 'Michael Eze',
    providerAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    customerName: 'You',
    date: '2025-07-25',
    time: '15:00',
    location: 'Auditorium, ABUAD',
    price: 50000,
    notes: '',
    status: 'reviewed',
    createdAt: '2025-07-10',
  },
];

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProviderById(id: string): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export function getReviewsByProvider(providerId: string): Review[] {
  return reviews.filter((r) => r.providerId === providerId);
}
