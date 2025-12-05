'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthCard } from "@/components/auth/AuthCard"
import { FormField } from "@/components/auth/FormField"
import { ErrorMessage } from "@/components/auth/ErrorMessage"

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error} />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
