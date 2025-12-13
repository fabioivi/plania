/**
 * Academic Service
 * Academic-related API calls (credentials, diaries, teaching plans, content)
 */

import { apiClient } from './client'
import type {
  AcademicCredential,
  Diary,
  DiaryContent,
  TeachingPlan,
  DiaryWithPlans,
  SaveCredentialRequest,
  TestCredentialResponse,
  DeleteCredentialResponse,
  SyncDiariesResponse,
  GetDiaryContentStatsResponse,
  SyncSpecificDiaryResponse,
  SyncSpecificTeachingPlanResponse,
  GenerateDiaryContentFromPlanRequest,
  GenerateDiaryContentFromPlanResponse,
  SaveDiaryContentBulkRequest,
  SaveDiaryContentBulkResponse,
  SendDiaryContentToSystemResponse,
  SendDiaryContentBulkRequest,
  SendDiaryContentBulkResponse,
} from '@/types'

export const academicService = {
  // ============================================
  // Credentials
  // ============================================

  async getCredentials(): Promise<AcademicCredential[]> {
    const response = await apiClient.get<AcademicCredential[]>('/academic/credentials')
    return response.data
  },

  async saveCredential(data: SaveCredentialRequest): Promise<AcademicCredential> {
    const response = await apiClient.post<AcademicCredential>('/academic/credentials', data)
    return response.data
  },

  async testCredential(id: string): Promise<TestCredentialResponse> {
    const response = await apiClient.post<TestCredentialResponse>(`/academic/credentials/${id}/test`)
    return response.data
  },

  async deleteCredential(id: string): Promise<DeleteCredentialResponse> {
    const response = await apiClient.delete<DeleteCredentialResponse>(`/academic/credentials/${id}`)
    return response.data
  },

  async deleteAllData(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/academic/data')
    return response.data
  },

  // ============================================
  // Diaries
  // ============================================

  async syncDiaries(): Promise<SyncDiariesResponse> {
    const response = await apiClient.post<SyncDiariesResponse>('/academic/diaries/sync')
    return response.data
  },

  async getDiaries(): Promise<Diary[]> {
    const response = await apiClient.get<Diary[]>('/academic/diaries')
    return response.data
  },

  async getDiaryTeachingPlans(diaryId: string): Promise<TeachingPlan[]> {
    const response = await apiClient.get<TeachingPlan[]>(`/academic/diaries/${diaryId}/teaching-plans`)
    return response.data
  },

  async getDiaryWithPlans(diaryId: string): Promise<DiaryWithPlans> {
    const response = await apiClient.get<DiaryWithPlans>(`/academic/diaries/${diaryId}/with-plans`)
    return response.data
  },

  async syncSpecificDiary(diaryId: string): Promise<SyncSpecificDiaryResponse> {
    const response = await apiClient.post<SyncSpecificDiaryResponse>(`/academic/diaries/${diaryId}/sync`)
    return response.data
  },

  // ============================================
  // Diary Content
  // ============================================

  async getDiaryContent(diaryId: string): Promise<DiaryContent[]> {
    const response = await apiClient.get<DiaryContent[]>(
      `/academic/diaries/${diaryId}/content?t=${Date.now()}`
    )
    return response.data
  },

  async getDiaryContentStats(diaryId: string): Promise<GetDiaryContentStatsResponse> {
    const response = await apiClient.get<GetDiaryContentStatsResponse>(
      `/academic/diaries/${diaryId}/content/stats?t=${Date.now()}`
    )
    return response.data
  },

  async generateDiaryContentFromPlan(
    diaryId: string,
    data: GenerateDiaryContentFromPlanRequest
  ): Promise<GenerateDiaryContentFromPlanResponse> {
    const response = await apiClient.post<GenerateDiaryContentFromPlanResponse>(
      `/academic/diaries/${diaryId}/generate-from-plan`,
      data
    )
    return response.data
  },

  async saveDiaryContentBulk(
    diaryId: string,
    data: SaveDiaryContentBulkRequest
  ): Promise<SaveDiaryContentBulkResponse> {
    const response = await apiClient.post<SaveDiaryContentBulkResponse>(
      `/academic/diaries/${diaryId}/content/bulk`,
      data
    )
    return response.data
  },

  async sendDiaryContentToSystem(
    diaryId: string,
    contentId: string
  ): Promise<SendDiaryContentToSystemResponse> {
    const response = await apiClient.post<SendDiaryContentToSystemResponse>(
      `/academic/diaries/${diaryId}/content/${contentId}/send`
    )
    return response.data
  },

  async sendDiaryContentBulkToSystem(
    diaryId: string,
    data: SendDiaryContentBulkRequest
  ): Promise<SendDiaryContentBulkResponse> {
    const response = await apiClient.post<SendDiaryContentBulkResponse>(
      `/academic/diaries/${diaryId}/content/send-bulk`,
      data
    )
    return response.data
  },

  // ============================================
  // Teaching Plans
  // ============================================

  async syncSpecificTeachingPlan(planId: string): Promise<SyncSpecificTeachingPlanResponse> {
    const response = await apiClient.post<SyncSpecificTeachingPlanResponse>(
      `/academic/teaching-plans/${planId}/sync`
    )
    return response.data
  },
}
