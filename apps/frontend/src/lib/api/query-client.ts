/**
 * React Query Client Configuration
 * Centralized configuration for React Query (TanStack Query)
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data is considered fresh for 5 mins
      gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection time
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on internet reconnection
    },
    mutations: {
      retry: false, // Don't retry failed mutations
    },
  },
})

// Query keys factory for type-safe and consistent query keys
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'current-user'] as const,
  },

  // Diaries
  diaries: {
    all: ['diaries'] as const,
    lists: () => [...queryKeys.diaries.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.diaries.lists(), { filters }] as const,
    details: () => [...queryKeys.diaries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.diaries.details(), id] as const,
    withPlans: (id: string) => [...queryKeys.diaries.detail(id), 'with-plans'] as const,
    content: (id: string) => [...queryKeys.diaries.detail(id), 'content'] as const,
    stats: (id: string) => [...queryKeys.diaries.detail(id), 'stats'] as const,
  },

  // Teaching Plans
  teachingPlans: {
    all: ['teaching-plans'] as const,
    lists: () => [...queryKeys.teachingPlans.all, 'list'] as const,
    list: (diaryId: string) => [...queryKeys.teachingPlans.lists(), { diaryId }] as const,
    details: () => [...queryKeys.teachingPlans.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teachingPlans.details(), id] as const,
  },

  // Credentials
  credentials: {
    all: ['credentials'] as const,
    lists: () => [...queryKeys.credentials.all, 'list'] as const,
  },

  // LLM Configs
  llmConfigs: {
    all: ['llm-configs'] as const,
    lists: () => [...queryKeys.llmConfigs.all, 'list'] as const,
    details: () => [...queryKeys.llmConfigs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.llmConfigs.details(), id] as const,
  },
}
