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
    mutationFn: (data: SaveCredentialRequest) => {
      console.log('📡 [useSaveCredential] Calling API saveCredential:', data.system)
      return academicService.saveCredential(data)
    },
    onSuccess: (data) => {
      console.log('✅ [useSaveCredential] API Success:', data)
      // Invalidate credentials list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })
      toast.success('Credenciais salvas', {
        description: 'Suas credenciais foram armazenadas com sucesso.'
      })
    },
    onError: (error: any) => {
      console.error('❌ [useSaveCredential] API Error:', error)
      const message = error.response?.data?.message || 'Erro ao salvar credenciais'
      toast.error('Erro ao salvar', {
        description: message
      })
    },
  })
}

/**
 * Test academic credential
 */
export function useTestCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      console.log('📡 [useTestCredential] Calling API testCredential for ID:', id)
      return academicService.testCredential(id)
    },
    onSuccess: (data) => {
      console.log('✅ [useTestCredential] API Success:', data)
      // Invalidate credentials to refetch with updated status
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })

      if (data.isVerified) {
        toast.success('Acesso confirmado', {
          description: 'Suas credenciais foram verificadas com sucesso.',
        })
      } else {
        // Fallback: If no specific error message, show the whole object or a clear warning
        const errorDesc = data.lastError || `Erro sem detalhes (Backend retornou null). Dados: ${JSON.stringify(data)}`;
        toast.error('Falha na autenticação', {
          description: errorDesc,
        })
      }
    },
    onError: (error: any) => {
      console.error('❌ [useTestCredential] API Error:', error)
      const message = error.response?.data?.message || 'Erro ao testar credenciais'
      toast.error('Erro de conexão', {
        description: message
      })
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
      toast.success('Credencial removida', {
        description: 'A credencial foi excluída do sistema.'
      })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao remover credenciais'
      toast.error('Erro ao remover', {
        description: message
      })
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
      toast.success('Dados excluídos', {
        description: 'Todos os diários e planos foram removidos com sucesso.'
      })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao excluir dados'
      toast.error('Erro na exclusão', {
        description: message
      })
    },
  })
}
