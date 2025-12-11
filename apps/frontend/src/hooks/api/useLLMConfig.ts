/**
 * useLLMConfig Hook
 * React Query hooks for LLM configuration management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { llmService } from '@/services/api'
import { queryKeys } from '@/lib/api/query-client'
import type {
  SaveLLMConfigRequest,
  UpdateLLMConfigRequest,
} from '@/types'

/**
 * Get all LLM configurations
 */
export function useLLMConfigs() {
  return useQuery({
    queryKey: queryKeys.llmConfigs.lists(),
    queryFn: llmService.getConfigs,
  })
}

/**
 * Get specific LLM configuration
 */
export function useLLMConfig(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.llmConfigs.detail(id!),
    queryFn: () => llmService.getConfig(id!),
    enabled: !!id,
  })
}

/**
 * Save new LLM configuration
 */
export function useSaveLLMConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveLLMConfigRequest) => llmService.saveConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.all })
      toast.success('Configuração salva com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar configuração'
      toast.error(message)
    },
  })
}

/**
 * Update existing LLM configuration
 */
export function useUpdateLLMConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLLMConfigRequest }) =>
      llmService.updateConfig(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.lists() })
      toast.success('Configuração atualizada com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar configuração'
      toast.error(message)
    },
  })
}

/**
 * Delete LLM configuration
 */
export function useDeleteLLMConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => llmService.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.all })
      toast.success('Configuração removida com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao remover configuração'
      toast.error(message)
    },
  })
}

/**
 * Test LLM configuration API key
 */
export function useTestLLMConfig() {
  return useMutation({
    mutationFn: (id: string) => llmService.testApiKey(id),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Chave de API válida!')
      } else {
        toast.error(data.message || 'Chave de API inválida')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao testar chave de API'
      toast.error(message)
    },
  })
}

/**
 * Activate LLM configuration
 */
export function useActivateLLMConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => llmService.activateConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.all })
      toast.success('Configuração ativada com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao ativar configuração'
      toast.error(message)
    },
  })
}
