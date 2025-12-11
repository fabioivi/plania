/**
 * useDiaries Hook
 * React Query hooks for diaries data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { academicService } from '@/services/api'
import { queryKeys } from '@/lib/api/query-client'
import type {
  Diary,
  DiaryContent,
  DiaryWithPlans,
  SaveDiaryContentBulkRequest,
  SendDiaryContentBulkRequest,
} from '@/types'

/**
 * Get all diaries for current user
 */
export function useDiaries() {
  return useQuery({
    queryKey: queryKeys.diaries.lists(),
    queryFn: academicService.getDiaries,
  })
}

/**
 * Get specific diary with teaching plans
 */
export function useDiary(diaryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diaries.withPlans(diaryId!),
    queryFn: () => academicService.getDiaryWithPlans(diaryId!),
    enabled: !!diaryId, // Only run if diaryId is provided
  })
}

/**
 * Get diary content
 */
export function useDiaryContent(diaryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diaries.content(diaryId!),
    queryFn: () => academicService.getDiaryContent(diaryId!),
    enabled: !!diaryId,
  })
}

/**
 * Get diary content statistics
 */
export function useDiaryContentStats(diaryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diaries.stats(diaryId!),
    queryFn: () => academicService.getDiaryContentStats(diaryId!),
    enabled: !!diaryId,
  })
}

/**
 * Sync all diaries from academic system
 */
export function useSyncDiaries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: academicService.syncDiaries,
    onSuccess: () => {
      // Invalidate diaries list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.all })
      toast.success('Diários sincronizados com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao sincronizar diários'
      toast.error(message)
    },
  })
}

/**
 * Sync specific diary
 */
export function useSyncSpecificDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (diaryId: string) => academicService.syncSpecificDiary(diaryId),
    onSuccess: (data, diaryId) => {
      // Invalidate specific diary queries
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.detail(diaryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.content(diaryId) })
      toast.success(`${data.synced} conteúdos sincronizados!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao sincronizar diário'
      toast.error(message)
    },
  })
}

/**
 * Generate diary content from teaching plan
 */
export function useGenerateDiaryContentFromPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      diaryId,
      teachingPlanId,
    }: {
      diaryId: string
      teachingPlanId: string
    }) =>
      academicService.generateDiaryContentFromPlan(diaryId, { teachingPlanId }),
    onSuccess: (data, { diaryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.content(diaryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.stats(diaryId) })
      toast.success(`${data.generatedCount} conteúdos gerados!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao gerar conteúdos'
      toast.error(message)
    },
  })
}

/**
 * Save diary content in bulk
 */
export function useSaveDiaryContentBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      diaryId,
      data,
    }: {
      diaryId: string
      data: SaveDiaryContentBulkRequest
    }) => academicService.saveDiaryContentBulk(diaryId, data),
    onSuccess: (data, { diaryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.content(diaryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.stats(diaryId) })
      toast.success(`${data.savedCount} conteúdos salvos!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar conteúdos'
      toast.error(message)
    },
  })
}

/**
 * Send diary content to system
 */
export function useSendDiaryContentToSystem() {
  return useMutation({
    mutationFn: ({
      diaryId,
      contentId,
    }: {
      diaryId: string
      contentId: string
    }) => academicService.sendDiaryContentToSystem(diaryId, contentId),
    onSuccess: () => {
      toast.success('Conteúdo enviado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao enviar conteúdo'
      toast.error(message)
    },
  })
}

/**
 * Send diary content in bulk to system
 * Note: Progress is tracked via SSE, not this mutation
 */
export function useSendDiaryContentBulkToSystem() {
  return useMutation({
    mutationFn: ({
      diaryId,
      data,
    }: {
      diaryId: string
      data: SendDiaryContentBulkRequest
    }) => academicService.sendDiaryContentBulkToSystem(diaryId, data),
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao enviar conteúdos'
      toast.error(message)
    },
  })
}
