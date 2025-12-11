/**
 * useTeachingPlans Hook
 * React Query hooks for teaching plans data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { academicService } from '@/services/api'
import { queryKeys } from '@/lib/api/query-client'
import type { TeachingPlan } from '@/types'

/**
 * Get teaching plans for a specific diary
 */
export function useTeachingPlans(diaryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teachingPlans.list(diaryId!),
    queryFn: () => academicService.getDiaryTeachingPlans(diaryId!),
    enabled: !!diaryId,
  })
}

/**
 * Sync specific teaching plan
 */
export function useSyncTeachingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => academicService.syncSpecificTeachingPlan(planId),
    onSuccess: (data, planId) => {
      // Invalidate teaching plan queries
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.detail(planId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })
      toast.success('Plano de ensino sincronizado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao sincronizar plano de ensino'
      toast.error(message)
    },
  })
}
