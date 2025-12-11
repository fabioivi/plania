/**
 * useLoginForm Hook
 * Form hook for login with validation
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLogin } from '../api'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth.schema'

export function useLoginForm() {
  const { mutate: login, isPending } = useLogin()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    login(data)
  })

  return {
    ...form,
    onSubmit,
    isSubmitting: isPending,
  }
}
