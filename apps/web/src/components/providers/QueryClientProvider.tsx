'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';

/**
 * QueryClient instance
 * 
 * Configured with default options for the application.
 * Stale time is set to 5 minutes for most queries.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export interface QueryClientProviderProps {
  children: React.ReactNode;
}

/**
 * QueryClientProvider component
 * 
 * Provides TanStack Query context to the application.
 * Should be added to the root layout.
 */
export function QueryClientProvider({ children }: QueryClientProviderProps) {
  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}
