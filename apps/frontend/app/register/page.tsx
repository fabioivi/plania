'use client'

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthCard } from "@/components/auth/AuthCard"
import { FormField } from "@/components/auth/FormField"
import { ErrorMessage } from "@/components/auth/ErrorMessage"

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Create Account"
        description="Fill in your details to create an account"
        footer={
          <p className="text-sm text-muted-foreground text-center w-full">
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:underline">
              Entrar
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error} />

          <FormField
            id="name"
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Minimum 6 characters"
          />

          <FormField
            id="confirm-password"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
