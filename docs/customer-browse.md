# Customer Browse Page (`/customer/browse`)

Customer-facing marketplace view for discovering approved services/providers on Servicely.

## Route & entry points

- **Route:** `/customer/browse` (`src/App.tsx`)
- **Protection:** wrapped in `ProtectedRoute role="customer"`
- **Page component:** `src/pages/customer/CustomerBrowse.tsx` (`CustomerBrowse`)
- **Layout:** `DashboardLayout` with `DashboardHeader` and customer nav (`src/data/customerNavItems.ts`)
- **Common inbound links:**
  - Customer navigation: **Browse Services** (`/customer/browse`)
  - Dashboard/search/category shortcuts (e.g. `/customer/browse?q=...`, `/customer/browse?category=...`)

## Purpose

- Fetch and display the approved service catalogue.
- Let customers search, filter by category, sort, and paginate results.
- Present results grouped by provider (one card per provider group) with quick actions to book a service or view the provider profile.
- Exclude the signed-in user’s own services from the browse feed (when a stored user identity is available).

## Data source

- **Query hook:** `useApprovedServices()` from `src/hooks/queries.ts`
  - **Endpoint:** `GET /provider/approved-services`
  - **Auth:** `optional` (request-level), while the route itself is customer-protected
  - **Query key:** `['providers', 'approved-services']`
  - **Returns:** `ServiceLike[]` (`data.services ?? []`)
- **Types/UI contracts:** `ServiceLike`, `ServiceCard`, `SearchBar`, `EmptyState`, `ErrorState`, `Badge`, `Button`, `Skeleton` from `src/components/ui.tsx`
- **Static category seeds:** `categories` from `src/data/mockData.ts` (merged with categories found in fetched services)

## URL query parameters (state sync)

Browse state is synchronized with the URL for deep-linking, sharing, refresh/back-forward restore, and dashboard handoff.

| Param | Purpose | Notes |
|---|---|---|
| `q` | Search query | `search` is also accepted on read for compatibility; updates write `q` and remove `search`. |
| `category` | Selected category label | `All` is represented by omitting the param. Matching is case/trim-insensitive. Invalid values are normalized/cleared. |
| `sort` | Sort mode | `newest` (default, omitted), `price-low`, `price-high`, `name`. Invalid values fall back to `newest`. |
| `page` | Provider-group results page | 1-based, clamped to available pages. Omitted when page 1. |

Changing search/category/sort resets `page` to 1.

## Behavior

### Identity & filtering
- Reads the signed-in user once from `sessionStorage` key `servicely_user` (best-effort) to exclude services whose provider id matches the current user.
- Services without a resolvable provider id are still shown (but booking/provider actions may be unavailable).

### Search
- Client-side, case-insensitive match against: service `title`, `description`, `category`, and provider name.
- Search is applied before category counts, category filtering, sorting, grouping, and pagination.

### Categories
- Category options = `All` + unique categories from static seeds and fetched services.
- Chip counts are computed from **search-matched** services (so counts reflect the active search context), then category filter is applied to results.
- Category comparison/count keys are normalized (trim + lowercase) to reduce casing/format mismatches.

### Sorting
- Applied to matched services **before** provider grouping:
  - `newest`: `createdAt` descending (missing/invalid timestamps treated as oldest)
  - `price-low`: ascending price (unknown/non-numeric prices sorted last)
  - `price-high`: descending price (unknown/non-numeric prices sorted last)
  - `name`: service title A→Z
- Sorting influences which service becomes the representative for a provider group.

### Provider grouping & pagination
- Matched/sorted services are grouped by provider id (fallback key for provider-less records).
- Each group renders one `ServiceCard` (representative service) with metadata:
  - `providerServiceCount`
  - `additionalServicesCount` (`+N more` badge when > 0)
  - `providerServices` (services in that group context)
- **Page size:** 4 provider groups per page.
- Pagination UI is shown only when there is more than one page; page index is clamped to valid bounds.

### Actions & navigation
- **Book Now:** shown when provider id and service id are available.
  - Link: `/book/:providerId?service=:serviceId` (params encoded)
  - If required ids are missing, booking is disabled/unavailable instead of linking to an invalid URL.
- **View provider:** shown when provider id is available.
  - Link: `/providers/:providerId` (encoded)
  - Passes `state.providerServices` (memoized provider services map) for existing consumer behavior.
- **Refresh:** triggers query refetch; button shows loading state during background fetch.

## UI states

- **Loading:** skeleton grid, `aria-busy` container, sr-only loading text, disabled refresh.
- **Error:** `ErrorState` with API-derived message (`getApiErrorMessage`) and retry.
- **Empty (no matches):** `EmptyState` with clear-filters action when filters/search/sort are active.
- **Empty (no data):** `EmptyState` with refresh action when catalogue is empty.
- **Populated:** result toolbar (service/provider counts), provider-group card grid, and pagination (when applicable).

## Accessibility notes

- Semantic/ARIA patterns used in page: labeled search/filter region, labeled sort/select, category chip `aria-pressed`, `aria-live="polite"` result/pagination summaries, loading busy state, descriptive/unique link labels for booking and provider actions, list semantics for results (`role="list"` / `role="listitem"`).
- Reduced-motion support for card entrance animations via `useReducedMotion`.
- `EmptyState`/`ErrorState` come from shared UI primitives (`src/components/ui.tsx`); `EmptyState` uses a status role for announcements.
- Further runtime verification recommended for: color contrast in all themes/states, global focus-ring visibility, and touch target comfort across devices.

## Implementation notes

- **Key files:**
  - `src/pages/customer/CustomerBrowse.tsx` — page logic/UI
  - `src/hooks/queries.ts` — `useApprovedServices`
  - `src/components/ui.tsx` — `ServiceLike`, `ServiceCard`, shared UI states/primitives/helpers
  - `src/components/DashboardLayout.tsx` — layout shell/header
  - `src/data/customerNavItems.ts`, `src/data/mockData.ts`
- **Important helpers in page:** search matching, category normalization, price/date normalization, sort comparison, URL param parsing/sync, provider grouping.
- **Performance approach (current):** client-side filter/sort/group over fetched catalogue with memoized derivations and memoized provider-services lookup; suitable for moderate dataset sizes.

## Known limitations / follow-ups

- **Representative grouping semantics:** each provider group is represented by a single service card (chosen from sorted matches). Other matching services from the same provider are indicated by count/badge but not individually selectable from this grid.
- **Client-side catalogue processing:** all filtering/sorting/grouping/pagination happens in-browser after fetching approved services; consider server-driven query/pagination/facets for large datasets.
- **Router state trust boundary:** `View provider` passes `providerServices` via navigation state; consuming pages should treat it as untrusted/hint data (not an audit/fix target of this page).
- **Identity source:** current-user exclusion relies on a one-time `sessionStorage` read; reactive auth context would better handle session changes.
- **Testing/observability:** add component/integration/E2E coverage for URL sync, filter/sort/group/pagination, CTA/link correctness, and error/empty/loading states; add production error/usage instrumentation as needed.

## Quick manual checks

- Open `/customer/browse`, `/customer/browse?q=<term>`, `/customer/browse?category=<name>&sort=price-low&page=2`.
- Verify search/category/sort/page persist on refresh and browser back/forward.
- Verify category chip counts update with search; invalid category/page params normalize.
- Verify `Book Now` is disabled/unavailable when service id is missing and routes correctly when present.
- Verify `View provider` label is unique per card and navigation works.
- Verify loading, error+retry, empty (no data), and empty (no matches) states.