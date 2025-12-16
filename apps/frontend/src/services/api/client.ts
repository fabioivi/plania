/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies automatically
})

// Request interceptor: Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // Redirect to login if not already on auth pages
        const isAuthPage = window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/register')

        if (!isAuthPage) {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Export base URL for other uses
export { API_BASE_URL }
