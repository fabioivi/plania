/**
 * Common/Shared Types
 * Utility types and shared interfaces used across the application
 */

// ============================================
// Async State Types
// ============================================

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  status: AsyncStatus
  error: Error | null
}

// ============================================
// Sync/Operation Types
// ============================================

export type SyncType = 'download' | 'upload' | 'sync'

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'

export interface SyncProgress {
  percentage: number
  message: string
  currentItem?: string
  totalItems?: number
  processedItems?: number
}

export interface SyncState {
  status: SyncStatus
  progress: SyncProgress
  error: string | null
}

// ============================================
// SSE (Server-Sent Events) Types
// ============================================

export interface SSEMessage<T = any> {
  type: string
  data: T
  timestamp: number
}

export interface SSEProgressMessage {
  percentage: number
  message: string
  step?: string
}

export interface SSEErrorMessage {
  error: string
  message: string
}

// ============================================
// Table/List Types
// ============================================

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T> {
  key: keyof T
  direction: SortDirection
}

export interface FilterConfig<T> {
  field: keyof T
  value: any
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt'
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total?: number
}

// ============================================
// Component State Types
// ============================================

export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error'

export interface ComponentState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// ============================================
// Action/Event Types
// ============================================

export interface Action<T = any> {
  type: string
  payload?: T
}

export type ActionHandler<T = any> = (payload: T) => void | Promise<void>

// ============================================
// Dialog/Modal Types
// ============================================

export interface DialogState {
  open: boolean
  title?: string
  message?: string
  onConfirm?: () => void
  onCancel?: () => void
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
}

// ============================================
// Wizard/Stepper Types
// ============================================

export type WizardStep = 'config' | 'generating' | 'success'

export interface WizardState<T extends string = WizardStep> {
  currentStep: T
  completedSteps: T[]
  canGoNext: boolean
  canGoPrevious: boolean
}

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type ValueOf<T> = T[keyof T]

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

// ============================================
// Date/Time Types
// ============================================

export type DateString = string // ISO 8601 format

export type TimeRange = `${number}:${number}-${number}:${number}` // e.g., "13:00-15:00"

// ============================================
// ID Types
// ============================================

export type UUID = string

export type ID = string | number

// ============================================
// Config Types
// ============================================

export interface AppConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  features: {
    [key: string]: boolean
  }
}
