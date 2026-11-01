/**
 * Domain hooks built on TanStack React Query.
 *
 * Queries are keyed centrally so mutations can invalidate exactly the
 * data they affect. That keeps every screen (public pages, customer,
 * provider, admin) in sync without manual refetching.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  apiGet,
  apiSend,
  buildQuery,
  hasAdminToken,
  hasUserToken,
  type AuthMode,
} from '@/lib/api';
import type { ProviderLike, ServiceLike } from '@/components/ui';

/* =========================================================
   RESPONSE SHAPES (backend-compatible, intentionally loose)
========================================================= */

export interface ListResponse<T> {
  success?: boolean;
  count?: number;
  message?: string;
  [key: string]: unknown;
  data?: T[];
}

export interface ApprovedServicesResponse {
  success?: boolean;
  message?: string;
  services?: ServiceLike[];
}

export interface ProviderProfileResponse {
  success?: boolean;
  message?: string;
  provider?: ProviderLike;
  services?: ServiceLike[];
  reviews?: unknown[];
}

export interface BookingsResponse {
  success?: boolean;
  message?: string;
  bookings?: Array<Record<string, unknown>>;
  data?: Array<Record<string, unknown>>;
}

export interface ReviewsResponse {
  success?: boolean;
  message?: string;
  reviews?: Array<Record<string, unknown>>;
  averageRating?: number;
  count?: number;
  provider?: ProviderLike;
}

export interface RecommendedProvidersResponse {
  success?: boolean;
  message?: string;
  providers?: ProviderLike[];
  count?: number;
}

export interface SavedProvidersResponse {
  success?: boolean;
  message?: string;
  savedProviders?: ProviderLike[];
}

export interface PortfolioResponse {
  success?: boolean;
  message?: string;
  portfolio?: Array<Record<string, unknown>>;
  count?: number;
}

export interface AvailabilityResponse {
  success?: boolean;
  message?: string;
  availability?: Array<Record<string, unknown>>;
}

export interface ProviderAccountResponse {
  success?: boolean;
  message?: string;
  account?: Record<string, unknown>;
}

export interface BanksResponse {
  success?: boolean;
  message?: string;
  banks?: Array<Record<string, unknown>>;
}

export interface AdminReviewsResponse {
  success?: boolean;
  message?: string;
  reviews?: Array<Record<string, unknown>>;
}

/* =========================================================
   QUERY KEYS
========================================================= */

export const queryKeys = {
  providers: {
    all: ['providers'] as const,
    approvedServices: ['providers', 'approved-services'] as const,
    saved: ['providers', 'saved'] as const,
    recommended: (limit: number) => ['providers', 'recommended', limit] as const,
    profile: (id: string) => ['providers', 'profile', id] as const,
    publicProfile: (id: string) => ['providers', 'public-profile', id] as const,
    details: (id: string) => ['providers', 'details', id] as const,
  },
  services: {
    all: ['services'] as const,
    mine: ['services', 'mine'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    customer: ['bookings', 'customer'] as const,
    provider: ['bookings', 'provider'] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    mine: ['reviews', 'mine'] as const,
    myProviderProfile: ['reviews', 'my-provider-profile'] as const,
    provider: (id: string) => ['reviews', 'provider', id] as const,
  },
  portfolio: {
    all: ['portfolio'] as const,
    mine: ['portfolio', 'mine'] as const,
    provider: (id: string) => ['portfolio', 'provider', id] as const,
  },
  availability: ['provider', 'availability'] as const,
  providerAccount: {
    all: ['provider-account'] as const,
    account: ['provider-account', 'account'] as const,
    banks: ['provider-account', 'banks'] as const,
  },
  admin: {
    all: ['admin'] as const,
    exists: ['admin', 'exists'] as const,
    users: ['admin', 'users'] as const,
    providers: ['admin', 'providers'] as const,
    provider: (id: string) => ['admin', 'providers', id] as const,
    bookings: ['admin', 'bookings'] as const,
    verification: (status: string) => ['admin', 'verification', status] as const,
    reviews: ['admin', 'reviews'] as const,
  },
} as const;

/* =========================================================
   SHARED HELPERS
========================================================= */

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  'queryKey' | 'queryFn'
> & { enabled?: boolean };

function userEnabled(enabled = true) {
  return enabled && hasUserToken();
}

function adminEnabled(enabled = true) {
  return enabled && hasAdminToken();
}

/* =========================================================
   PUBLIC / MARKETPLACE
========================================================= */

export function useApprovedServices(options: QueryOptions<ServiceLike[]> = {}) {
  return useQuery({
    queryKey: queryKeys.providers.approvedServices,
    queryFn: async ({ signal }) => {
      const data = await apiGet<ApprovedServicesResponse>(
        '/provider/approved-services',
        { auth: 'optional', signal }
      );
      return Array.isArray(data?.services) ? data.services : [];
    },
    ...options,
  });
}

export function useProviderProfile(id?: string, options: QueryOptions<ProviderProfileResponse> = {}) {
  return useQuery({
    queryKey: queryKeys.providers.profile(id || ''),
    queryFn: ({ signal }) =>
      apiGet<ProviderProfileResponse>(
        `/provider/profile/${encodeURIComponent(id || '')}`,
        { auth: 'user', signal }
      ),
    ...options,
    enabled: userEnabled(Boolean(id)) && (options.enabled ?? true),
  });
}

/** Public-safe variant that does not require a user session. */
export function useProviderPublicProfile(
  id?: string,
  options: QueryOptions<ProviderProfileResponse> = {}
) {
  return useQuery({
    queryKey: queryKeys.providers.publicProfile(id || ''),
    queryFn: ({ signal }) =>
      apiGet<ProviderProfileResponse>(
        `/provider/eachprofile/${encodeURIComponent(id || '')}`,
        { auth: 'optional', signal }
      ),
    enabled: Boolean(id) && (options.enabled ?? true),
    ...options,
  });
}

export function useProviderDetails(
  id?: string,
  options: QueryOptions<ProviderProfileResponse> = {}
) {
  return useQuery({
    queryKey: queryKeys.providers.details(id || ''),
    queryFn: ({ signal }) =>
      apiGet<ProviderProfileResponse>(
        `/provider/eachprofiledetails/${encodeURIComponent(id || '')}`,
        { auth: 'optional', signal }
      ),
    enabled: Boolean(id) && (options.enabled ?? true),
    ...options,
  });
}

export function useRecommendedProviders(
  limit = 6,
  options: QueryOptions<ProviderLike[]> = {}
) {
  return useQuery({
    queryKey: queryKeys.providers.recommended(limit),
    queryFn: async ({ signal }) => {
      const data = await apiGet<RecommendedProvidersResponse>(
        `/reviews/recommended${buildQuery({ limit })}`,
        { auth: 'optional', signal }
      );
      return Array.isArray(data?.providers) ? data.providers : [];
    },
    ...options,
  });
}

export function useSavedProviders(options: QueryOptions<SavedProvidersResponse> = {}) {
  return useQuery({
    queryKey: queryKeys.providers.saved,
    queryFn: ({ signal }) =>
      apiGet<SavedProvidersResponse>('/usercreative/providers/saved', {
        auth: 'user',
        signal,
      }),
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

/* =========================================================
   PROVIDER SERVICES
========================================================= */

export function useMyServices(options: QueryOptions<ServiceLike[]> = {}) {
  return useQuery({
    queryKey: queryKeys.services.mine,
    queryFn: async ({ signal }) => {
      const data = await apiGet<{ services?: ServiceLike[] }>(
        '/provider/services',
        { auth: 'user', signal }
      );
      return Array.isArray(data?.services) ? data.services : [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useCreateService() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiSend<{ success?: boolean; message?: string; service?: ServiceLike }>(
        '/provider/services',
        'POST',
        formData
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.services.mine });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

export function useUpdateService() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      apiSend<{ success?: boolean; message?: string; service?: ServiceLike }>(
        `/provider/services/${encodeURIComponent(id)}`,
        'PUT',
        formData
      ),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: queryKeys.services.mine });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
      client.invalidateQueries({ queryKey: queryKeys.providers.profile(variables.id) });
    },
  });
}

export function useDeleteService() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiSend<{ success?: boolean; message?: string }>(
        `/provider/services/${encodeURIComponent(id)}`,
        'DELETE'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.services.mine });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

/* =========================================================
   BOOKINGS
========================================================= */

export function useCustomerBookings(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.customer,
    queryFn: async ({ signal }) => {
      const data = await apiGet<BookingsResponse>('/bookings/my-bookings', {
        auth: 'user',
        signal,
      });
      if (Array.isArray(data?.bookings)) return data.bookings;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useProviderBookings(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.provider,
    queryFn: async ({ signal }) => {
      const data = await apiGet<BookingsResponse>('/bookings/provider-bookings', {
        auth: 'user',
        signal,
      });
      return Array.isArray(data?.bookings) ? data.bookings : [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useCreateBooking() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiSend<Record<string, unknown>>('/bookings/createbookings', 'POST', payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export function useCompleteBooking() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      apiSend<Record<string, unknown>>(
        `/bookings/${encodeURIComponent(bookingId)}/complete`,
        'PATCH'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export function useInitializePayment() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiSend<Record<string, unknown>>('/payments/initialize', 'POST', payload),
  });
}

export function useVerifyPayment(reference?: string, options: QueryOptions<Record<string, unknown>> = {}) {
  return useQuery({
    queryKey: ['payments', 'verify', reference || ''],
    queryFn: ({ signal }) =>
      apiGet<Record<string, unknown>>(
        `/payments/verify/${encodeURIComponent(reference || '')}`,
        { auth: 'user', signal }
      ),
    ...options,
    enabled: userEnabled(Boolean(reference)) && (options.enabled ?? true),
  });
}

/* =========================================================
   REVIEWS
========================================================= */

export function useProviderReviews(providerId?: string, options: QueryOptions<ReviewsResponse> = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.provider(providerId || ''),
    queryFn: ({ signal }) =>
      apiGet<ReviewsResponse>(
        `/reviews/provider/${encodeURIComponent(providerId || '')}`,
        { auth: 'optional', signal }
      ),
    enabled: Boolean(providerId) && (options.enabled ?? true),
    ...options,
  });
}

export function useMyReviews(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.mine,
    queryFn: async ({ signal }) => {
      const data = await apiGet<ReviewsResponse>('/reviews/my-reviews', {
        auth: 'user',
        signal,
      });
      return Array.isArray(data?.reviews) ? data.reviews : [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useMyProviderProfile(options: QueryOptions<ReviewsResponse> = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.myProviderProfile,
    queryFn: ({ signal }) =>
      apiGet<ReviewsResponse>('/reviews/my-profile', { auth: 'user', signal }),
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useCreateReview() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiSend<Record<string, unknown>>('/reviews/addreviews', 'POST', payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.reviews.all });
      client.invalidateQueries({ queryKey: queryKeys.bookings.all });
      client.invalidateQueries({ queryKey: ['providers', 'recommended'] });
    },
  });
}

export function useUpdateReview() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiSend<Record<string, unknown>>(
        `/reviews/updatereview/${encodeURIComponent(id)}`,
        'PUT',
        payload
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.reviews.all });
      client.invalidateQueries({ queryKey: ['providers', 'recommended'] });
    },
  });
}

export function useDeleteReview() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiSend<Record<string, unknown>>(
        `/reviews/deletereview/${encodeURIComponent(id)}`,
        'DELETE'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.reviews.all });
      client.invalidateQueries({ queryKey: ['providers', 'recommended'] });
    },
  });
}

/* =========================================================
   SAVED PROVIDERS
========================================================= */

export function useToggleSavedProvider() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) =>
      apiSend<{ success?: boolean; saved?: boolean; providerId?: string }>(
        `/usercreative/providers/${encodeURIComponent(providerId)}/save`,
        'PUT'
      ),
    onMutate: async (providerId) => {
      await client.cancelQueries({ queryKey: queryKeys.providers.saved });
      const previous = client.getQueryData<SavedProvidersResponse>(
        queryKeys.providers.saved
      );

      client.setQueryData<SavedProvidersResponse>(
        queryKeys.providers.saved,
        (current) => {
          const list = Array.isArray(current?.savedProviders)
            ? current?.savedProviders || []
            : [];
          const exists = list.some(
            (provider) => String(provider?._id || provider?.id) === providerId
          );

          return {
            ...(current || {}),
            success: true,
            savedProviders: exists
              ? list.filter(
                  (provider) => String(provider?._id || provider?.id) !== providerId
                )
              : [...list, { _id: providerId } as ProviderLike],
          };
        }
      );

      return { previous };
    },
    onError: (_error, _providerId, context) => {
      if (context?.previous) {
        client.setQueryData(queryKeys.providers.saved, context.previous);
      }
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: queryKeys.providers.saved });
    },
  });
}

/* =========================================================
   PORTFOLIO
========================================================= */

export function useMyPortfolio(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.portfolio.mine,
    queryFn: async ({ signal }) => {
      const data = await apiGet<PortfolioResponse>('/portfolio/allportfolio', {
        auth: 'user',
        signal,
      });
      return Array.isArray(data?.portfolio) ? data.portfolio : [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useProviderPortfolio(
  providerId?: string,
  options: QueryOptions<Array<Record<string, unknown>>> = {}
) {
  return useQuery({
    queryKey: queryKeys.portfolio.provider(providerId || ''),
    queryFn: async ({ signal }) => {
      const data = await apiGet<PortfolioResponse>(
        `/portfolio/provider/${encodeURIComponent(providerId || '')}`,
        { auth: 'optional', signal }
      );
      return Array.isArray(data?.portfolio) ? data.portfolio : [];
    },
    enabled: Boolean(providerId) && (options.enabled ?? true),
    ...options,
  });
}

export function useAddPortfolio() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiSend<PortfolioResponse>('/portfolio/allportfolio', 'POST', formData),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.portfolio.all });
    },
  });
}

export function useDeletePortfolio() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiSend<{ success?: boolean; message?: string }>(
        `/portfolio/allportfolio/${encodeURIComponent(id)}`,
        'DELETE'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.portfolio.all });
    },
  });
}

/* =========================================================
   AVAILABILITY
========================================================= */

export function useAvailability(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.availability,
    queryFn: async ({ signal }) => {
      const data = await apiGet<AvailabilityResponse>(
        '/availability/getavailability',
        { auth: 'user', signal }
      );
      if (Array.isArray(data?.availability)) return data.availability;
      if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
      return [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useUpdateAvailability() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (availability: Array<Record<string, unknown>>) =>
      apiSend<Record<string, unknown>>(
        '/availability/postavailability',
        'PUT',
        { availability }
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.availability });
    },
  });
}

/* =========================================================
   PROVIDER PAYOUT ACCOUNT
========================================================= */

export function useProviderAccount(options: QueryOptions<ProviderAccountResponse> = {}) {
  return useQuery({
    queryKey: queryKeys.providerAccount.account,
    queryFn: ({ signal }) =>
      apiGet<ProviderAccountResponse>('/provider-account/account', {
        auth: 'user',
        signal,
      }),
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useBanks(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.providerAccount.banks,
    queryFn: async ({ signal }) => {
      const data = await apiGet<BanksResponse>('/provider-account/banks', {
        auth: 'user',
        signal,
      });
      return Array.isArray(data?.banks) ? data.banks : [];
    },
    ...options,
    enabled: userEnabled(options.enabled ?? true),
  });
}

export function useSetupProviderAccount() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiSend<ProviderAccountResponse>('/provider-account/account', 'POST', payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.providerAccount.all });
    },
  });
}

export function useRefreshPaystackStatus() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiGet<ProviderAccountResponse>('/provider-account/refresh-paystack-status', {
        auth: 'user',
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.providerAccount.all });
    },
  });
}

/* =========================================================
   AUTH MUTATIONS (customer / provider)
========================================================= */

export interface UpdateProfilePayload {
  name: string;
  about: string;
  location: string;
  avatar?: File | null;
}

export function useUpdateProviderProfile() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ name, about, location, avatar }: UpdateProfilePayload) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('about', about);
      formData.append('location', location);
      if (avatar instanceof File) formData.append('avatar', avatar);
      return apiSend<{ success?: boolean; message?: string; user?: unknown }>(
        '/usercreative/provider/profile',
        'PUT',
        formData
      );
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.reviews.myProviderProfile });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

/* =========================================================
   ADMIN
========================================================= */

export function useAdminExists(options: QueryOptions<{ exists?: boolean }> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.exists,
    queryFn: ({ signal }) =>
      apiGet<{ exists?: boolean }>('/admin/exists', { auth: 'none', signal }),
    staleTime: 5_000,
    ...options,
  });
}

export function useAdminLogin() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiSend<{ success?: boolean; message?: string; token?: string; admin?: unknown }>(
        '/admin/login',
        'POST',
        payload,
        { auth: 'none' }
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useAdminRegister() {
  return useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      apiSend<{ success?: boolean; message?: string }>(
        '/admin/register',
        'POST',
        payload,
        { auth: 'none' }
      ),
  });
}

export function useAdminUsers(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: async ({ signal }) => {
      const data = await apiGet<{ users?: Array<Record<string, unknown>> }>(
        '/admin/getallusers',
        { auth: 'admin', signal }
      );
      return Array.isArray(data?.users) ? data.users : [];
    },
    ...options,
    enabled: adminEnabled(options.enabled ?? true),
  });
}

export function useAdminProviders(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.providers,
    queryFn: async ({ signal }) => {
      const data = await apiGet<{ providers?: Array<Record<string, unknown>> }>(
        '/admin/providers',
        { auth: 'admin', signal }
      );
      return Array.isArray(data?.providers) ? data.providers : [];
    },
    ...options,
    enabled: adminEnabled(options.enabled ?? true),
  });
}

export function useAdminProvider(id?: string, options: QueryOptions<ProviderProfileResponse> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.provider(id || ''),
    queryFn: ({ signal }) =>
      apiGet<ProviderProfileResponse>(
        `/admin/providers/${encodeURIComponent(id || '')}`,
        { auth: 'admin', signal }
      ),
    ...options,
    enabled: adminEnabled(Boolean(id)) && (options.enabled ?? true),
  });
}

export function useAdminBookings(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.bookings,
    queryFn: async ({ signal }) => {
      const data = await apiGet<BookingsResponse>('/admin/getallbookings', {
        auth: 'admin',
        signal,
      });
      return Array.isArray(data?.bookings) ? data.bookings : [];
    },
    ...options,
    enabled: adminEnabled(options.enabled ?? true),
  });
}

export function useAdminVerification(
  status: string,
  options: QueryOptions<Array<Record<string, unknown>>> = {}
) {
  return useQuery({
    queryKey: queryKeys.admin.verification(status),
    queryFn: async ({ signal }) => {
      const data = await apiGet<Record<string, unknown>>(
        `/verification/providers${buildQuery({ status })}`,
        { auth: 'admin', signal }
      );

      const candidates = [
        (data as { providers?: unknown })?.providers,
        (data as { data?: unknown })?.data,
        (data as { users?: unknown })?.users,
        data,
      ];

      const list = candidates.find(Array.isArray);
      return Array.isArray(list) ? (list as Array<Record<string, unknown>>) : [];
    },
    ...options,
    enabled: adminEnabled(options.enabled ?? true),
  });
}

export function useAdminReviews(options: QueryOptions<Array<Record<string, unknown>>> = {}) {
  return useQuery({
    queryKey: queryKeys.admin.reviews,
    queryFn: async ({ signal }) => {
      const data = await apiGet<AdminReviewsResponse>('/adminreviews/allreviews', {
        auth: 'admin',
        signal,
      });
      return Array.isArray(data?.reviews) ? data.reviews : [];
    },
    ...options,
    enabled: adminEnabled(options.enabled ?? true),
  });
}

export function useAdminProviderStatus() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) =>
      apiSend<Record<string, unknown>>(
        `/admin/providers/${encodeURIComponent(id)}/${suspend ? 'suspend' : 'unsuspend'}`,
        'PATCH'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.admin.providers });
      client.invalidateQueries({ queryKey: ['admin', 'verification'] });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

export type VerificationAction = 'approve' | 'reject' | 'restore' | 'suspend' | 'unsuspend';

export function useAdminVerificationAction() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: VerificationAction }) =>
      apiSend<Record<string, unknown>>(
        `/verification/providers/${encodeURIComponent(id)}/${action}`,
        'PATCH'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.admin.providers });
      client.invalidateQueries({ queryKey: ['admin', 'verification'] });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

export function useAdminReviewVisibility() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hide }: { id: string; hide: boolean }) =>
      apiSend<Record<string, unknown>>(
        `/adminreviews/${encodeURIComponent(id)}/${hide ? 'hide' : 'unhide'}`,
        'PATCH'
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.admin.reviews });
      client.invalidateQueries({ queryKey: queryKeys.reviews.all });
      client.invalidateQueries({ queryKey: queryKeys.providers.all });
    },
  });
}

/* Re-export for pages that want to set a query cache manually. */
export { useQueryClient };
export type { AuthMode };
