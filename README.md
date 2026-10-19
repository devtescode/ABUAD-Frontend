# Servicely — ABUAD Student Service Marketplace (Frontend)

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-si9muhug)

Servicely is the frontend for a campus service marketplace built for **ABUAD (Afe Babalola University)**. It connects students who need services (photography, videography, graphic design, makeup, …) with verified student service providers, and gives administrators tooling to verify providers, moderate bookings/reviews, and process payouts.

The app is a **React 18 + TypeScript + Vite** single-page application styled with **Tailwind CSS** (with light/dark mode). It talks to a separate REST backend (Node/Express + MongoDB — documents use `_id` fields) and uses **Paystack** for payments and provider payouts.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Routing Map](#routing-map)
- [Backend API Surface Used](#backend-api-surface-used)
- [Authentication Model](#authentication-model)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Known Issues / Audit Notes](#known-issues--audit-notes)

---

## What It Does

Servicely has **three roles**, each with its own dashboard and feature set:

### Customers (students booking services)
- Browse and search approved services and providers by category
- View public provider profiles (about, portfolio, reviews, availability, services)
- Save/unsave providers (synced with the backend)
- Multi-step booking flow: choose service → date/time/location/notes → confirm → **Paystack checkout** → payment verification → review
- Manage bookings, write/edit/delete reviews, edit profile & settings

### Providers (students offering services)
- Onboarding and public profile management (avatar, about, location)
- Full CRUD for services and portfolio items
- Weekly availability schedule management
- Incoming booking requests: accept/complete bookings
- Bookings history, earnings overview, reviews about them
- Payout setup via **Paystack transfer accounts** (bank selection, account details, transfer status refresh)

### Administrators
- First-run self-registration (only while no admin exists — checked via `GET /admin/exists`), then login only
- Dashboard with platform stats
- Manage all users and providers (suspend/unsuspend)
- Provider **verification queue**: approve / reject / restore / suspend ID documents
- Manage bookings, payments, reviews (hide/unhide), disputes, featured providers, categories, analytics and settings

### Public site
- Landing page, services catalog, providers directory, individual provider profile pages, "How it Works", and About pages
- Light/dark theme (class-based Tailwind dark mode, persisted in `localStorage`, respects system preference)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3 + TypeScript 5.5 |
| Build tool | Vite 5 |
| Routing | react-router-dom 7 |
| Styling | Tailwind CSS 3.4 (custom `primary` / `accent` / `ink` palettes), PostCSS + Autoprefixer |
| Animations | framer-motion 13 |
| Icons | lucide-react |
| State | React Context (`AppContext` for auth/bookings, `ThemeContext` for theming) |
| HTTP | Native `fetch` (no axios / data-fetching library) |
| Payments | Paystack (via backend `/payments/*` endpoints) |
| Hosting | Vercel-ready (`vercel.json` SPA rewrites) |

> `@supabase/supabase-js` is listed in `package.json` but **is not used anywhere** in the source code.

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A running instance of the Servicely backend REST API (default `http://localhost:5000`)

### Installation

```bash
git clone <repo-url>
cd ABUAD-Frontend
npm install
```

### Run in development

```bash
npm run dev
```

Vite serves the app on `http://localhost:5173` and proxies nothing — point it at your backend with `VITE_API_URL` (see below).

### Production build

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

---

## Environment Variables

Create a `.env` file in the project root (already git-ignored):

```env
# Base URL of the backend REST API
VITE_API_URL=http://localhost:5000
```

If `VITE_API_URL` is not set, every API call falls back to `http://localhost:5000`.

No secrets belong in this repo — Paystack secret keys, DB credentials etc. live on the backend. The frontend only receives Paystack **authorization URLs** from the server and redirects the user to Paystack's hosted checkout, then verifies the transaction reference via `GET /payments/verify/:reference`.

---

## Project Structure

```
src/
├── App.tsx                    # Router + providers + ProtectedRoute
├── main.tsx                   # Entry point
├── index.css                  # Tailwind base/global styles
├── components/
│   ├── DashboardLayout.tsx    # Shared sidebar/topbar dashboard shell
│   ├── shared.tsx             # Reusable UI (buttons, modals, badges, …)
│   ├── CustomerServiceCard.tsx
│   └── ThemeToggle.tsx
├── context/
│   ├── AppContext.tsx         # Auth (signup/login/JWT), bookings, saved providers
│   └── ThemeContext.tsx       # Light/dark theme
├── data/
│   ├── mockData.ts            # Types + seed/demo data (categories, providers, …)
│   ├── adminNavItems.ts       # Sidebar navigation per role
│   ├── customerNavItems.ts
│   └── providerNavItems.ts
└── pages/
    ├── public/                # HomePage, ServicesPage, StaticPages (About/How it works)
    ├── auth/                  # AuthPages (customer/provider), AdminAuth
    ├── customer/              # Dashboard, Browse, Saved, Bookings, Reviews, Profile
    ├── provider/              # Dashboard, Services, Portfolio, Availability, Requests,
    │                          # Bookings, Earnings, Reviews, Profile, Payout account
    ├── admin/                 # Dashboard, Users, Providers, Verification, Bookings,
    │                          # Payments, Reviews, Disputes, Featured, Analytics, Settings
    └── booking/               # BookingFlow (booking → Paystack payment → review)
```

---

## Routing Map

### Public
| Path | Page |
|---|---|
| `/` | Home |
| `/services` | Services catalog |
| `/providers` | Providers directory |
| `/providers/:id` | Public provider profile |
| `/how-it-works`, `/about` | Static pages |

### Auth
| Path | Page |
|---|---|
| `/signup`, `/signup/:role` | Role selection + signup (customer/provider) |
| `/login`, `/login/:role` | Login (customer/provider) |
| `/forgot-password` | Password recovery |
| `/login/admin` | Admin login / first-run registration |

### Booking flow
| Path | Page |
|---|---|
| `/book/:id` | Multi-step booking |
| `/booking-confirmed/:id` | Confirmation |
| `/payment/:id` | Paystack payment + verification |
| `/review/:id` | Leave a review |

### Customer (protected) — `/customer`, `/customer/browse`, `/customer/saved`, `/customer/bookings`, `/customer/reviews`, `/customer/profile`, `/customer/settings`

### Provider (protected) — `/provider`, `/provider/services`, `/provider/add-service`, `/provider/portfolio`, `/provider/availability`, `/provider/requests`, `/provider/bookings`, `/provider/earnings`, `/provider/reviews`, `/provider/profile`, `/provider/settings`, `/provider/add-account`
(`​/provider/onboarding` is public.)

### Admin (protected) — `/admin`, `/admin/users`, `/admin/providers`, `/admin/providers/:id`, `/admin/verification`, `/admin/categories`, `/admin/bookings`, `/admin/payments`, `/admin/reviews`, `/admin/disputes`, `/admin/featured`, `/admin/analytics`, `/admin/settings`

Any unmatched route redirects to `/`.

---

## Backend API Surface Used

The frontend expects a REST API with these route groups (JWT bearer auth on protected endpoints):

| Prefix | Purpose |
|---|---|
| `/usercreative/*` | Signup, login, profile update, saved providers |
| `/provider/*` | Provider profile, provider services, approved services |
| `/availability/*` | Weekly availability get/post |
| `/portfolio/*` | Portfolio CRUD |
| `/bookings/*` | Create, my-bookings, provider-bookings, complete |
| `/reviews/*` | Add/update/delete/list reviews, recommended |
| `/payments/*` | Paystack initialize + verify |
| `/provider-account/*` | Payout account, banks list, Paystack transfer status |
| `/verification/*` | Admin verification queue (approve/reject/suspend/restore) |
| `/admin/*` | Admin auth (`exists`, `register`, `login`), users, providers, bookings |
| `/adminreviews/*` | Admin moderation of reviews |

---

## Authentication Model

- **Customers & providers**: signup/login against `/usercreative/*`; the backend returns a JWT + user object. Both are stored in `sessionStorage` (`servicely_token`, `servicely_user`) — state clears when the tab closes.
- **Admins**: completely separate auth system with its own token (`servicely_admin_token`), stored in `sessionStorage`.
- JWT expiry is decoded client-side (`isTokenExpired`) and enforced by logout timers in both `AuthProvider` and `ProtectedRoute`.
- `ProtectedRoute` guards every dashboard route, redirecting unauthenticated users to `/login/:role` and mismatched roles to their own dashboard.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint (**currently broken — see audit notes**) |
| `npm run typecheck` | `tsc --noEmit` (**currently broken — see audit notes**) |

---

## Deployment

`vercel.json` rewrites all routes to `index.html` for client-side routing. To deploy:

1. Set `VITE_API_URL` to your production backend URL in the project's environment settings.
2. Build command: `npm run build` · Output directory: `dist`

Remember to enable CORS on the backend for the deployed frontend origin.

---

## Known Issues / Audit Notes

Findings from a code audit (October 2026):

### Build & tooling
- ✅ `npm run build` succeeds (single bundle: ~947 KB JS / ~220 KB gzipped, ~117 KB CSS).
- ❌ **`npm run typecheck` fails**: `tsconfig.app.json` sets `"ignoreDeprecations": "6.0"`, which TypeScript 5.5 rejects (valid value is `"5.0"`, or simply remove it). This also disables type-checking during CI pipelines.
- ❌ **`npm run lint` fails**: ESLint 9.39 crashes loading `@typescript-eslint/no-unused-expressions` — the installed `eslint` / `typescript-eslint` / `eslint-plugin-react-hooks` versions are mismatched and need to be re-pinned to compatible versions.
- ⚠️ **No code splitting**: everything compiles into one ~947 KB chunk even though route pages are huge (`BookingFlow.tsx` and `ProviderProfilePage.tsx` are each ~126 KB of source). Use `React.lazy` + `Suspense` per route to cut initial load time significantly.
- ⚠️ `index.html` references `/vite.svg` as the favicon but there is **no `public/` directory**, so the favicon 404s.

### Dependencies
- ⚠️ Unused runtime dependencies: `@supabase/supabase-js`, `browserslist`, `caniuse-lite` (none are imported anywhere in `src/`). Remove or move to devDependencies.

### Code quality
- ⚠️ **Dead/duplicate state**: `AuthProvider` in `AppContext.tsx` holds `savedProviders` + `fetchSavedProviders()` that are never exposed through the context value (the real saved-providers state lives in `BookingProvider`).
- ⚠️ **`API_URL` is re-declared in ~15 files** with slightly different fallbacks instead of one shared config module (`src/config/api.ts`).
- ⚠️ **No centralized HTTP layer**: every page hand-rolls `fetch` + `response.json()` + error handling; there is no 401/refresh interceptor, so an expired token mid-session surfaces as a generic error on each page.
- ⚠️ **Very large single-file pages**: several pages exceed 30–50 KB of TSX in one file; extract components to make them maintainable.
- ⚠️ Consider a data-fetching library (React Query / SWR) — refetch, loading and error logic is duplicated across pages.

### Security
- ⚠️ Admin **first-run registration** (`/login/admin` → `/admin/exists` → register mode) is open to anyone until the first admin account is created. This must be locked down on the backend (e.g., invite token) for production.
- ⚠️ Role checks are client-side only (`ProtectedRoute`); every protected endpoint must re-verify the JWT role server-side.
- ✅ No hardcoded secrets/API keys found in the frontend source.

### UI / UX
- ⚠️ **Dark mode is incomplete**: `DARK_MODE_MISSING_CLASSES.md` documents 96+ missing `dark:` text-color variants across 8 files — many pages are unreadable or low-contrast in dark mode.
- ⚠️ Some demo/mock data (`src/data/mockData.ts`) is still used for categories and seed content; wire these to backend endpoints.
