'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthCard } from "@/components/auth/AuthCard"
import { useLoginForm } from "@/hooks/forms"

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { register, onSubmit, isSubmitting, formState: { errors } } = useLoginForm()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  return (
    <AuthLayout>
      <AuthCard
        title="Entrar"
        description="Digite suas credenciais para acessar o sistema"
        footer={
          <p className="text-sm text-muted-foreground text-center w-full">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium hover:underline">
              Create account
            </Link>
          </p>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 cursor-pointer"
            />
            <Label
              htmlFor="remember"
              className="text-sm cursor-pointer select-none"
            >
              Keep me logged in
            </Label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
