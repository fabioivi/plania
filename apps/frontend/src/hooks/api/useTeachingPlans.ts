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
 * Get a specific teaching plan by ID
 */
export function useTeachingPlan(planId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teachingPlans.detail(planId!),
    queryFn: async () => {
      const { apiClient } = await import('@/services/api/client')
      const response = await apiClient.get<TeachingPlan>(`/academic/teaching-plans/${planId}`)
      return response.data
    },
    enabled: !!planId,
  })
}

/**
 * Sync specific teaching plan
 */
export function useSyncTeachingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => academicService.syncSpecificTeachingPlan(planId),
    onSuccess: (_data, planId) => {
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

/**
 * Save AI-generated teaching plan
 */
export function useSaveAITeachingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      diaryId: string
      generatedPlan: any
      basePlanId?: string
    }) => {
      const { apiClient } = await import('@/services/api/client')
      const response = await apiClient.post<{ success: boolean; plan: TeachingPlan }>(
        '/academic/teaching-plans/ai',
        data
      )
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate teaching plans queries
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })
      if (data.plan.diaryId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teachingPlans.list(data.plan.diaryId),
        })
      }
      toast.success('Plano de ensino salvo com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar plano de ensino'
      toast.error(message)
    },
  })
}

/**
 * Update teaching plan
 */
export function useUpdateTeachingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ planId, data }: {
      planId: string
      data: {
        objetivoGeral?: string
        objetivosEspecificos?: string
        numAulasTeorica?: number
        numAulasPraticas?: number
        propostaTrabalho?: any[]
      }
    }) => {
      const { apiClient } = await import('@/services/api/client')
      const response = await apiClient.put<{ success: boolean; plan: TeachingPlan }>(
        `/academic/teaching-plans/${planId}`,
        data
      )
      return response.data
    },
    onSuccess: (_data, { planId }) => {
      // Invalidate teaching plan queries
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.detail(planId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar plano de ensino'
      toast.error(message)
    },
  })
}

/**
 * Delete teaching plan (AI-generated plans only)
 */
export function useDeleteTeachingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (planId: string) => {
      const { apiClient } = await import('@/services/api/client')
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/academic/teaching-plans/${planId}`
      )
      return response.data
    },
    onSuccess: (_data, planId) => {
      // Invalidate all teaching plan queries
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })
      queryClient.removeQueries({ queryKey: queryKeys.teachingPlans.detail(planId) })
      toast.success('Plano de ensino excluído com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao excluir plano de ensino'
      toast.error(message)
    },
  })
}
