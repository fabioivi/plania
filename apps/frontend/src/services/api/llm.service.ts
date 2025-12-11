/**
 * LLM Config Service
 * LLM configuration-related API calls
 */

import { apiClient } from './client'
import type {
  LLMConfig,
  SaveLLMConfigRequest,
  UpdateLLMConfigRequest,
  TestLLMConfigResponse,
} from '@/types'

export const llmService = {
  /**
   * Get all LLM configurations for current user
   */
  async getConfigs(): Promise<LLMConfig[]> {
    const response = await apiClient.get<LLMConfig[]>('/llm-config')
    return response.data
  },

  /**
   * Get specific LLM configuration by ID
   */
  async getConfig(id: string): Promise<LLMConfig> {
    const response = await apiClient.get<LLMConfig>(`/llm-config/${id}`)
    return response.data
  },

  /**
   * Save new LLM configuration
   */
  async saveConfig(data: SaveLLMConfigRequest): Promise<LLMConfig> {
    const response = await apiClient.post<LLMConfig>('/llm-config', data)
    return response.data
  },

  /**
   * Update existing LLM configuration
   */
  async updateConfig(id: string, data: UpdateLLMConfigRequest): Promise<LLMConfig> {
    const response = await apiClient.put<LLMConfig>(`/llm-config/${id}`, data)
    return response.data
  },

  /**
   * Delete LLM configuration
   */
  async deleteConfig(id: string): Promise<void> {
    await apiClient.delete(`/llm-config/${id}`)
  },

  /**
   * Test LLM configuration API key
   */
  async testApiKey(id: string): Promise<TestLLMConfigResponse> {
    const response = await apiClient.post<TestLLMConfigResponse>(`/llm-config/${id}/test`)
    return response.data
  },

  /**
   * Activate specific LLM configuration (deactivates others)
   */
  async activateConfig(id: string): Promise<LLMConfig> {
    const response = await apiClient.put<LLMConfig>(`/llm-config/${id}/activate`)
    return response.data
  },
}
