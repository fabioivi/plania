/**
 * Auth Service
 * Authentication-related API calls
 */

import { apiClient } from './client'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/types'

export const authService = {
  /**
   * Login user with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  /**
   * Logout current user (client-side only)
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user')
      if (userJson) {
        try {
          return JSON.parse(userJson)
        } catch {
          return null
        }
      }
    }
    return null
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token')
    }
    return false
  },
}
