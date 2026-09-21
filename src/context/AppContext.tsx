// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   type ReactNode,
// } from 'react';

// import type { UserRole, Booking } from '@/data/mockData';

// // ─────────────────────────────────────────────────────────────────────────────
// // API CONFIG
// // ─────────────────────────────────────────────────────────────────────────────

// const API_URL = 'http://localhost:5000';

// // ─────────────────────────────────────────────────────────────────────────────
// // USER TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// export interface User {
//   id: string;
//   name: string;
//   matricNo: string;
//   email: string;
//   phoneNumber: string;
//   gender: 'male' | 'female';
//   role: UserRole;
//   status?: 'active' | 'pending' | 'suspended';
//   avatar?: string;
// }

// type SignupRole = 'customer' | 'provider';

// type LoginRole = 'customer' | 'provider';

// // ─────────────────────────────────────────────────────────────────────────────
// // AUTH CONTEXT
// // ─────────────────────────────────────────────────────────────────────────────

// interface AuthContextType {
//   user: User | null;

//   login: (
//     email: string,
//     password: string,
//     role: LoginRole
//   ) => Promise<any>;

//   signup: (
//     name: string,
//     matricNo: string,
//     email: string,
//     phoneNumber: string,
//     gender: 'male' | 'female',
//     password: string,
//     role: SignupRole
//   ) => Promise<any>;

//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(
//   undefined
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // AUTH PROVIDER
// // ─────────────────────────────────────────────────────────────────────────────

// export function AuthProvider({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const [user, setUser] = useState<User | null>(null);

//   // ───────────────────────────────────────────────────────────────────────────
//   // RESTORE USER FROM LOCAL STORAGE
//   // ───────────────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     const storedUser = sessionStorage.getItem('servicely_user');
//     const token = sessionStorage.getItem('servicely_token');

//     if (storedUser && token) {
//       try {
//         const parsedUser: User = JSON.parse(storedUser);
//         setUser(parsedUser);
//       } catch (error) {
//         console.error(
//           'Failed to restore stored user:',
//           error
//         );

//         sessionStorage.removeItem('servicely_user');
//         sessionStorage.removeItem('servicely_token');
//       }
//     }
//   }, []);

//   // ───────────────────────────────────────────────────────────────────────────
//   // SIGNUP
//   // ───────────────────────────────────────────────────────────────────────────

//   // ───────────────────────────────────────────────────────────────────────────
//   // SIGNUP
//   // ───────────────────────────────────────────────────────────────────────────

//   const signup = async (
//     name: string,
//     matricNo: string,
//     email: string,
//     phoneNumber: string,
//     gender: 'male' | 'female',
//     password: string,
//     role: SignupRole
//   ) => {
//     try {
//       const response = await fetch(
//         `${API_URL}/usercreative/signup`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             name,
//             matricNo,
//             email,
//             phoneNumber,
//             gender,
//             password,
//             role,
//           }),
//         }
//       );

//       const data = await response.json();

//       // Backend returned an error
//       if (!response.ok) {
//         throw new Error(
//           data?.message || 'Unable to create account'
//         );
//       }

//       // Signup should NOT automatically log the user in.
//       // Do NOT save token.
//       // Do NOT save user.
//       // Do NOT call setUser().

//       return data;
//     } catch (error: any) {
//       console.error('Signup error:', error);

//       throw new Error(
//         error?.message ||
//         'Unable to create your account. Please try again.'
//       );
//     }
//   };
//   // ───────────────────────────────────────────────────────────────────────────
//   // LOGIN
//   // ───────────────────────────────────────────────────────────────────────────

//   // ───────────────────────────────────────────────────────────────────────────
//   // LOGIN
//   // ───────────────────────────────────────────────────────────────────────────

//   const login = async (
//     email: string,
//     password: string,
//     role: LoginRole
//   ) => {
//     try {
//       const response = await fetch(
//         `${API_URL}/usercreative/login`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             email,
//             password,
//             role,
//           }),
//         }
//       );

//       const data = await response.json();

//       // Backend returned an error
//       if (!response.ok) {
//         throw new Error(
//           data?.message ||
//           'Invalid email or password.'
//         );
//       }

//       if (!data?.user) {
//         throw new Error(
//           'Login successful, but user information was not returned.'
//         );
//       }

//       // Save JWT token ONLY after successful login
//       if (data.token) {
//         sessionStorage.setItem(
//           'servicely_token',
//           data.token
//         );
//       }

//       // Save logged-in user
//       sessionStorage.setItem(
//         'servicely_user',
//         JSON.stringify(data.user)
//       );

//       // Now the user is actually authenticated
//       setUser(data.user);

//       return data;
//     } catch (error: any) {
//       console.error('Login error:', error);

//       throw new Error(
//         error?.message ||
//         'Unable to login. Please check your details.'
//       );
//     }
//   };
//   // ───────────────────────────────────────────────────────────────────────────
//   // LOGOUT
//   // ───────────────────────────────────────────────────────────────────────────

//   const logout = () => {
//     setUser(null);

//     sessionStorage.removeItem('servicely_user');
//     sessionStorage.removeItem('servicely_token');
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         login,
//         signup,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // USE AUTH
// // ─────────────────────────────────────────────────────────────────────────────

// // eslint-disable-next-line react-refresh/only-export-components
// export function useAuth() {
//   const ctx = useContext(AuthContext);

//   if (!ctx) {
//     throw new Error(
//       'useAuth must be used within AuthProvider'
//     );
//   }

//   return ctx;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // BOOKING CONTEXT
// // ─────────────────────────────────────────────────────────────────────────────

// interface BookingContextType {
//   bookings: Booking[];

//   addBooking: (booking: Booking) => void;

//   updateBookingStatus: (
//     id: string,
//     status: Booking['status']
//   ) => void;

//   savedProviders: string[];

//   toggleSavedProvider: (id: string) => void;
// }

// const BookingContext = createContext<
//   BookingContextType | undefined
// >(undefined);

// // ─────────────────────────────────────────────────────────────────────────────
// // BOOKING PROVIDER
// // ─────────────────────────────────────────────────────────────────────────────

// export function BookingProvider({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const [bookings, setBookings] = useState<Booking[]>(
//     []
//   );

//   const [savedProviders, setSavedProviders] =
//     useState<string[]>([]);

//   // ───────────────────────────────────────────────────────────────────────────
//   // RESTORE BOOKINGS
//   // ───────────────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     const storedBookings =
//       sessionStorage.getItem('servicely_bookings');

//     if (storedBookings) {
//       try {
//         setBookings(JSON.parse(storedBookings));
//       } catch (error) {
//         console.error(
//           'Failed to restore bookings:',
//           error
//         );
//       }
//     }

//     const storedSaved =
//       sessionStorage.getItem('servicely_saved');

//     if (storedSaved) {
//       try {
//         setSavedProviders(
//           JSON.parse(storedSaved)
//         );
//       } catch (error) {
//         console.error(
//           'Failed to restore saved providers:',
//           error
//         );
//       }
//     }
//   }, []);

//   // ───────────────────────────────────────────────────────────────────────────
//   // ADD BOOKING
//   // ───────────────────────────────────────────────────────────────────────────

//   const addBooking = (booking: Booking) => {
//     setBookings((prev) => {
//       const next = [booking, ...prev];

//       sessionStorage.setItem(
//         'servicely_bookings',
//         JSON.stringify(next)
//       );

//       return next;
//     });
//   };

//   // ───────────────────────────────────────────────────────────────────────────
//   // UPDATE BOOKING STATUS
//   // ───────────────────────────────────────────────────────────────────────────

//   const updateBookingStatus = (
//     id: string,
//     status: Booking['status']
//   ) => {
//     setBookings((prev) => {
//       const next = prev.map((booking) =>
//         booking.id === id
//           ? {
//             ...booking,
//             status,
//           }
//           : booking
//       );

//       sessionStorage.setItem(
//         'servicely_bookings',
//         JSON.stringify(next)
//       );

//       return next;
//     });
//   };

//   // ───────────────────────────────────────────────────────────────────────────
//   // SAVE / UNSAVE PROVIDER
//   // ───────────────────────────────────────────────────────────────────────────

//   const toggleSavedProvider = (id: string) => {
//     setSavedProviders((prev) => {
//       const next = prev.includes(id)
//         ? prev.filter((providerId) => providerId !== id)
//         : [...prev, id];

//       sessionStorage.setItem(
//         'servicely_saved',
//         JSON.stringify(next)
//       );

//       return next;
//     });
//   };

//   return (
//     <BookingContext.Provider
//       value={{
//         bookings,
//         addBooking,
//         updateBookingStatus,
//         savedProviders,
//         toggleSavedProvider,
//       }}
//     >
//       {children}
//     </BookingContext.Provider>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // USE BOOKINGS
// // ─────────────────────────────────────────────────────────────────────────────

// // eslint-disable-next-line react-refresh/only-export-components
// export function useBookings() {
//   const ctx = useContext(BookingContext);

//   if (!ctx) {
//     throw new Error(
//       'useBookings must be used within BookingProvider'
//     );
//   }

//   return ctx;
// }


import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import type { UserRole, Booking } from '@/data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// API CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  matricNo: string;
  email: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  role: UserRole;
  status?: 'active' | 'pending' | 'suspended';
  avatar?: string;
  about?: string;
  location?: string;
}

type SignupRole = 'customer' | 'provider';

type LoginRole = 'customer' | 'provider';

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE UPDATE TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface UpdateProfileData {
  name: string;
  about: string;
  location: string;
  // startingPrice: number;
  avatar?: File | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;

  login: (
    email: string,
    password: string,
    role: LoginRole
  ) => Promise<any>;

  signup: (
    name: string,
    matricNo: string,
    email: string,
    phoneNumber: string,
    gender: 'male' | 'female',
    password: string,
    role: SignupRole
  ) => Promise<any>;

  updateUser: (updatedUser: User) => void;

  updateProfile: (
    profileData: UpdateProfileData
  ) => Promise<any>;

  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // RESTORE USER FROM SESSION
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const storedUser = sessionStorage.getItem('servicely_user');
    const token = sessionStorage.getItem('servicely_token');

    if (storedUser && token) {
      try {
        const parsedUser: User = JSON.parse(storedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error(
          'Failed to restore stored user:',
          error
        );

        sessionStorage.removeItem('servicely_user');
        sessionStorage.removeItem('servicely_token');
      }
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // SIGNUP
  // ───────────────────────────────────────────────────────────────────────────

  const signup = async (
    name: string,
    matricNo: string,
    email: string,
    phoneNumber: string,
    gender: 'male' | 'female',
    password: string,
    role: SignupRole
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/usercreative/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            matricNo,
            email,
            phoneNumber,
            gender,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          'Unable to create account'
        );
      }

      return data;
    } catch (error: any) {
      console.error('Signup error:', error);

      throw new Error(
        error?.message ||
        'Unable to create your account. Please try again.'
      );
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ───────────────────────────────────────────────────────────────────────────

  const login = async (
    email: string,
    password: string,
    role: LoginRole
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/usercreative/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          'Invalid email or password.'
        );
      }

      if (!data?.user) {
        throw new Error(
          'Login successful, but user information was not returned.'
        );
      }

      if (data.token) {
        sessionStorage.setItem(
          'servicely_token',
          data.token
        );
      }

      sessionStorage.setItem(
        'servicely_user',
        JSON.stringify(data.user)
      );

      setUser(data.user);

      return data;
    } catch (error: any) {
      console.error('Login error:', error);

      throw new Error(
        error?.message ||
        'Unable to login. Please check your details.'
      );
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // UPDATE USER LOCALLY
  // ───────────────────────────────────────────────────────────────────────────

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);

    sessionStorage.setItem(
      'servicely_user',
      JSON.stringify(updatedUser)
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // UPDATE PROVIDER PROFILE
  // ───────────────────────────────────────────────────────────────────────────

  // const updateProfile = async (
  //   profileData: UpdateProfileData
  // ) => {
  //   const token = sessionStorage.getItem(
  //     'servicely_token'
  //   );

  //   if (!token) {
  //     throw new Error(
  //       'Your session has expired. Please login again.'
  //     );
  //   }

  //   if (!user?.id) {
  //     throw new Error(
  //       'User information is unavailable. Please login again.'
  //     );
  //   }

  //   try {
  //     /*
  //      * FormData is required because we may be sending
  //      * both normal profile fields and an image file.
  //      */
  //     const formData = new FormData();

  //     formData.append(
  //       'name',
  //       profileData.name
  //     );

  //     formData.append(
  //       'about',
  //       profileData.about
  //     );

  //     formData.append(
  //       'location',
  //       profileData.location
  //     );

  //     formData.append(
  //       'startingPrice',
  //       String(profileData.startingPrice)
  //     );

  //     if (profileData.avatar) {
  //       formData.append(
  //         'avatar',
  //         profileData.avatar
  //       );
  //     }

  //     /*
  //      * IMPORTANT:
  //      * Do NOT manually set Content-Type here.
  //      *
  //      * The browser automatically creates:
  //      * multipart/form-data; boundary=...
  //      */
  //     const response = await fetch(
  //       `${API_URL}/usercreative/provider/profile`,
  //       {
  //         method: 'PUT',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: formData,
  //       }
  //     );

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(
  //         data?.message ||
  //           'Unable to update your profile.'
  //       );
  //     }

  //     /*
  //      * We expect the backend to return:
  //      *
  //      * {
  //      *   user: {...}
  //      * }
  //      *
  //      * or directly return the updated user.
  //      */
  //     const updatedUser: User =
  //       data?.user || data;

  //     if (!updatedUser?.id) {
  //       throw new Error(
  //         'Profile was updated, but the backend did not return the updated user.'
  //       );
  //     }

  //     // Update React state
  //     setUser(updatedUser);

  //     // Update session storage
  //     sessionStorage.setItem(
  //       'servicely_user',
  //       JSON.stringify(updatedUser)
  //     );

  //     return data;
  //   } catch (error: any) {
  //     console.error(
  //       'Profile update error:',
  //       error
  //     );

  //     throw new Error(
  //       error?.message ||
  //         'Unable to update your profile. Please try again.'
  //     );
  //   }
  // };

  const updateProfile = async ({
    name,
    about,
    location,
    avatar,
  }: UpdateProfileData) => {
    try {
      const token =
        sessionStorage.getItem("servicely_token");

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const formData = new FormData();

      formData.append("name", name);
      formData.append("about", about);
      formData.append("location", location);

      if (avatar instanceof File) {
        formData.append("avatar", avatar);
      }

      const response = await fetch(
        `${API_URL}/usercreative/provider/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      console.log(
        "Profile update response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Failed to update profile."
        );
      }

      if (!data?.user) {
        throw new Error(
          "Profile was updated, but the backend did not return the updated user."
        );
      }

      /*
       * IMPORTANT:
       * Update React state with the complete backend user.
       */
      setUser(data.user);

      /*
       * IMPORTANT:
       * Persist the complete backend user.
       *
       * This is what allows the avatar to still exist
       * when AppContext restores the user after refresh.
       */
      sessionStorage.setItem(
        "servicely_user",
        JSON.stringify(data.user)
      );

      return data;

    } catch (error: any) {
      console.error(
        "Profile update error:",
        error
      );

      throw new Error(
        error?.message ||
        "Unable to update your profile. Please try again."
      );
    }
  };
  // ───────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ───────────────────────────────────────────────────────────────────────────

  const logout = () => {
    setUser(null);

    sessionStorage.removeItem(
      'servicely_user'
    );

    sessionStorage.removeItem(
      'servicely_token'
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        updateUser,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USE AUTH
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface BookingContextType {
  bookings: Booking[];

  addBooking: (booking: Booking) => void;

  updateBookingStatus: (
    id: string,
    status: Booking['status']
  ) => void;

  savedProviders: string[];

  toggleSavedProvider: (id: string) => void;
}

const BookingContext = createContext<
  BookingContextType | undefined
>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function BookingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [savedProviders, setSavedProviders] =
    useState<string[]>([]);

  // ───────────────────────────────────────────────────────────────────────────
  // RESTORE BOOKINGS
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const storedBookings =
      sessionStorage.getItem(
        'servicely_bookings'
      );

    if (storedBookings) {
      try {
        setBookings(
          JSON.parse(storedBookings)
        );
      } catch (error) {
        console.error(
          'Failed to restore bookings:',
          error
        );
      }
    }

    const storedSaved =
      sessionStorage.getItem(
        'servicely_saved'
      );

    if (storedSaved) {
      try {
        setSavedProviders(
          JSON.parse(storedSaved)
        );
      } catch (error) {
        console.error(
          'Failed to restore saved providers:',
          error
        );
      }
    }
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // ADD BOOKING
  // ───────────────────────────────────────────────────────────────────────────

  const addBooking = (booking: Booking) => {
    setBookings((prev) => {
      const next = [
        booking,
        ...prev,
      ];

      sessionStorage.setItem(
        'servicely_bookings',
        JSON.stringify(next)
      );

      return next;
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // UPDATE BOOKING STATUS
  // ───────────────────────────────────────────────────────────────────────────

  const updateBookingStatus = (
    id: string,
    status: Booking['status']
  ) => {
    setBookings((prev) => {
      const next = prev.map((booking) =>
        booking.id === id
          ? {
            ...booking,
            status,
          }
          : booking
      );

      sessionStorage.setItem(
        'servicely_bookings',
        JSON.stringify(next)
      );

      return next;
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SAVE / UNSAVE PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  const toggleSavedProvider = (
    id: string
  ) => {
    setSavedProviders((prev) => {
      const next = prev.includes(id)
        ? prev.filter(
          (providerId) =>
            providerId !== id
        )
        : [...prev, id];

      sessionStorage.setItem(
        'servicely_saved',
        JSON.stringify(next)
      );

      return next;
    });
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        addBooking,
        updateBookingStatus,
        savedProviders,
        toggleSavedProvider,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USE BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useBookings() {
  const ctx = useContext(BookingContext);

  if (!ctx) {
    throw new Error(
      'useBookings must be used within BookingProvider'
    );
  }

  return ctx;
}