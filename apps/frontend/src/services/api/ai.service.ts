/**
 * AI Service
 * AI-powered features API calls (teaching plan generation, etc.)
 */

import { apiClient } from './client'
import type {
  GenerateTeachingPlanRequest,
  GenerateTeachingPlanResponse,
} from '@/types'

export const aiService = {
  /**
   * Generate teaching plan using AI
   * Uses Server-Sent Events (SSE) for real-time progress updates
   */
  async generateTeachingPlan(data: GenerateTeachingPlanRequest): Promise<GenerateTeachingPlanResponse> {
    const response = await apiClient.post<GenerateTeachingPlanResponse>(
      '/ai/teaching-plans/generate',
      data
    )
    return response.data
  },

  /**
   * Get SSE stream URL for teaching plan generation progress
   * @param diaryId - The diary ID for which to generate the plan
   * @returns URL for EventSource connection
   */
  getGenerationProgressUrl(diaryId: string): string {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    return `${baseUrl}/ai/teaching-plans/generate-stream/${diaryId}?token=${token}`
  },
}
