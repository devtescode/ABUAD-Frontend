import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

/**
 * Shared React Query client.
 *
 * Defaults keep navigation snappy (fresh data is reused for 30s) while
 * still synchronising with the backend when the user returns to the tab,
 * reconnects, or after a mutation invalidates a query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if ([400, 401, 403, 404].includes(error.status)) return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
