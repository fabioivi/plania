/**
 * useRegisterForm Hook
 * Form hook for registration with validation
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRegister } from '../api'
import { registerSchema, type RegisterFormData } from '@/lib/validators/auth.schema'

export function useRegisterForm() {
  const { mutate: register, isPending } = useRegister()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = data
    register(registerData)
  })

  return {
    ...form,
    onSubmit,
    isSubmitting: isPending,
  }
}
