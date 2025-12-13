/**
 * useCredentials Hook
 * React Query hooks for academic credentials management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { academicService } from '@/services/api'
import { queryKeys } from '@/lib/api/query-client'
import type { SaveCredentialRequest } from '@/types'

/**
 * Get all academic credentials for current user
 */
export function useCredentials() {
  return useQuery({
    queryKey: queryKeys.credentials.lists(),
    queryFn: academicService.getCredentials,
  })
}

/**
 * Save academic credential
 */
export function useSaveCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveCredentialRequest) => academicService.saveCredential(data),
    onSuccess: () => {
      // Invalidate credentials list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })
      toast.success('Credenciais salvas com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar credenciais'
      toast.error(message)
    },
  })
}

/**
 * Test academic credential
 */
export function useTestCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => academicService.testCredential(id),
    onSuccess: (data) => {
      // Invalidate credentials to refetch with updated status
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })

      if (data.isVerified) {
        toast.success('✅ Credenciais verificadas com sucesso!')
      } else {
        toast.error(data.lastError || '❌ Falha na autenticação. Verifique suas credenciais.')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao testar credenciais'
      toast.error(message)
    },
  })
}

/**
 * Delete academic credential
 */
export function useDeleteCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => academicService.deleteCredential(id),
    onSuccess: () => {
      // Invalidate credentials list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })
      toast.success('Credenciais removidas com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao remover credenciais'
      toast.error(message)
    },
  })
}

/**
 * Delete all academic data
 */
export function useDeleteAllData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => academicService.deleteAllData(),
    onSuccess: () => {
      // Invalidate everything related to academic data
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all }) // Maybe not credentials, but good to be safe if status changes
      toast.success('Todos os dados foram excluídos com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao excluir dados'
      toast.error(message)
    },
  })
}
