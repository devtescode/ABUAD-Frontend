import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole, Booking } from '@/data/mockData';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  signup: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('servicely_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (email: string, role: UserRole) => {
    const name = role === 'admin' ? 'Admin User' : role === 'provider' ? 'Daniel Okonkwo' : 'John Student';
    const newUser: User = { id: 'u1', name, email, role };
    setUser(newUser);
    localStorage.setItem('servicely_user', JSON.stringify(newUser));
  };

  const signup = (name: string, email: string, role: UserRole) => {
    const newUser: User = { id: 'u1', name, email, role };
    setUser(newUser);
    localStorage.setItem('servicely_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('servicely_user');
  };

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  savedProviders: string[];
  toggleSavedProvider: (id: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedProviders, setSavedProviders] = useState<string[]>([]);

  useEffect(() => {
    const storedBookings = localStorage.getItem('servicely_bookings');
    if (storedBookings) setBookings(JSON.parse(storedBookings));
    const storedSaved = localStorage.getItem('servicely_saved');
    if (storedSaved) setSavedProviders(JSON.parse(storedSaved));
  }, []);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => {
      const next = [booking, ...prev];
      localStorage.setItem('servicely_bookings', JSON.stringify(next));
      return next;
    });
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, status } : b));
      localStorage.setItem('servicely_bookings', JSON.stringify(next));
      return next;
    });
  };

  const toggleSavedProvider = (id: string) => {
    setSavedProviders((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      localStorage.setItem('servicely_saved', JSON.stringify(next));
      return next;
    });
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBookingStatus, savedProviders, toggleSavedProvider }}>
      {children}
    </BookingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used within BookingProvider');
  return ctx;
}
