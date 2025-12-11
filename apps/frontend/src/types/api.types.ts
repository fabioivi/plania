/**
 * API Request/Response Types
 * Types for API requests and responses
 */

import type {
  User,
  AcademicCredential,
  Diary,
  DiaryContent,
  TeachingPlan,
  DiaryWithPlans,
  LLMConfig,
  LLMProvider,
  GeneratedTeachingPlan,
} from './entities.types'

// ============================================
// Auth API Types
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

// ============================================
// Academic Credentials API Types
// ============================================

export interface SaveCredentialRequest {
  system: string
  username: string
  password: string
}

export interface TestCredentialResponse {
  success: boolean
  isVerified: boolean
  lastError: string | null
  lastTestedAt: string | null
}

export interface DeleteCredentialResponse {
  message: string
}

// ============================================
// Diaries API Types
// ============================================

export interface SyncDiariesResponse {
  success: boolean
  message: string
}

export interface GetDiariesResponse extends Array<Diary> {}

export interface GetDiaryTeachingPlansResponse extends Array<TeachingPlan> {}

export interface GetDiaryWithPlansResponse extends DiaryWithPlans {}

export interface GetDiaryContentResponse extends Array<DiaryContent> {}

export interface GetDiaryContentStatsResponse {
  total: number
  realClasses: number
  anticipations: number
}

export interface SyncSpecificDiaryResponse {
  success: boolean
  diary: any
  synced: number
  realClasses: number
  anticipations: number
}

export interface SyncSpecificTeachingPlanResponse {
  success: boolean
  plan: any
}

export interface GenerateDiaryContentFromPlanRequest {
  teachingPlanId: string
}

export interface GenerateDiaryContentFromPlanResponse {
  success: boolean
  generatedCount: number
  contents: DiaryContent[]
  diary: any
  teachingPlan: any
}

export interface SaveDiaryContentBulkRequest {
  contents: Partial<DiaryContent>[]
}

export interface SaveDiaryContentBulkResponse {
  success: boolean
  savedCount: number
  contents: DiaryContent[]
}

export interface SendDiaryContentToSystemResponse {
  success: boolean
  message?: string
}

export interface SendDiaryContentBulkRequest {
  contentIds: string[]
}

export interface SendDiaryContentBulkResponse {
  success: boolean
  total: number
  succeeded: number
  failed: number
  results: Array<{
    contentId: string
    success: boolean
    message?: string
  }>
}

// ============================================
// LLM Config API Types
// ============================================

export interface SaveLLMConfigRequest {
  provider: LLMProvider
  apiKey: string
  modelName?: string
  isActive?: boolean
  additionalConfig?: Record<string, any>
}

export interface UpdateLLMConfigRequest {
  apiKey?: string
  modelName?: string
  isActive?: boolean
  additionalConfig?: Record<string, any>
}

export interface TestLLMConfigResponse {
  success: boolean
  message: string
}

export interface GetLLMConfigsResponse extends Array<LLMConfig> {}

// ============================================
// AI Teaching Plan Generation API Types
// ============================================

export interface GenerateTeachingPlanRequest {
  diaryId: string
  objectives?: string
  methodology?: string
  additionalNotes?: string
}

export interface GenerateTeachingPlanResponse {
  success: boolean
  plan: GeneratedTeachingPlan
}

// ============================================
// Generic API Types
// ============================================

export interface ApiError {
  message: string
  statusCode?: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SuccessResponse {
  success: boolean
  message?: string
}
