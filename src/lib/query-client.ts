/**
 * React Query Client Configuration
 * Centralized query client for data fetching and caching
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache is kept for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime in v4
      // Don't refetch on window focus (better UX)
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      // Retry failed requests once
      retry: 1,
      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

