/**
 * API Services Index
 * Centralized exports for all API services
 */

// Export API client
export { apiClient, API_BASE_URL } from './client'

// Export services
export { authService } from './auth.service'
export { academicService } from './academic.service'
export { llmService } from './llm.service'
export { aiService } from './ai.service'
export { adminService } from './admin.service'

// Legacy exports for backwards compatibility
// These re-export the old API structure from api.ts
// @deprecated - Use individual services instead
export { authApi, academicApi, llmConfigApi, aiApi, api } from '../api'
