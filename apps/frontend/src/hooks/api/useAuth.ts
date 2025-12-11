/**
 * useAuth Hook
 * React Query hooks for authentication
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '@/services/api'
import { queryKeys } from '@/lib/api/query-client'
import type { LoginRequest, RegisterRequest } from '@/types'

/**
 * Login mutation
 */
export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('user', JSON.stringify(response.user))

        // Dispatch custom event to notify AuthContext
        window.dispatchEvent(new Event('auth-change'))
      }

      // Set user in query cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), response.user)

      toast.success('Login realizado com sucesso!')

      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao fazer login'
      toast.error(message)
    },
  })
}

/**
 * Register mutation
 */
export function useRegister() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('user', JSON.stringify(response.user))

        // Dispatch custom event to notify AuthContext
        window.dispatchEvent(new Event('auth-change'))
      }

      // Set user in query cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), response.user)

      toast.success('Cadastro realizado com sucesso!')

      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao fazer cadastro'
      toast.error(message)
    },
  })
}

/**
 * Logout mutation (client-side only)
 */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      authService.logout()
      return Promise.resolve()
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear()

      toast.success('Logout realizado com sucesso!')

      // Redirect to login
      router.push('/login')
    },
  })
}

/**
 * Get current user from localStorage (not a query)
 */
export function useCurrentUser() {
  if (typeof window === 'undefined') {
    return null
  }

  return authService.getCurrentUser()
}

/**
 * Check if user is authenticated (not a query)
 */
export function useIsAuthenticated() {
  if (typeof window === 'undefined') {
    return false
  }

  return authService.isAuthenticated()
}
