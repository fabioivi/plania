/**
 * Form Types
 * Types for form data and validation
 */

import type { LLMProvider } from './entities.types'

// ============================================
// Auth Forms
// ============================================

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword?: string
}

// ============================================
// Academic Credential Forms
// ============================================

export interface CredentialFormData {
  system: string
  username: string
  password: string
}

// ============================================
// Teaching Plan Generation Forms
// ============================================

export interface PlanGenerationFormData {
  diaryId: string
  objectives?: string
  methodology?: string
  additionalNotes?: string
}

// ============================================
// LLM Config Forms
// ============================================

export interface LLMConfigFormData {
  provider: LLMProvider
  apiKey: string
  modelName?: string
  isActive?: boolean
  additionalConfig?: Record<string, any>
}

// ============================================
// Diary Content Forms
// ============================================

export interface DiaryContentFormData {
  date: string
  timeRange: string
  type: 'N' | 'A' | 'R'
  isNonPresential: boolean
  content: string
  observations?: string
  isAntecipation?: boolean
  originalContentId?: string | null
  originalDate?: string | null
}

// ============================================
// Generic Form Types
// ============================================

export interface FormError {
  field: string
  message: string
}

export type FormErrors<T> = Partial<Record<keyof T, string>>

export interface FormState<T> {
  data: T
  errors: FormErrors<T>
  isSubmitting: boolean
  isValid: boolean
}
