'use client'

import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getInitials = (name?: string) => {
    if (!name) return "JS"
    const words = name.trim().split(' ')
    if (words.length === 1) return words[0].charAt(0).toUpperCase()
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const formatName = (name?: string) => {
    if (!name) return "Prof. João Silva"
    // Capitalizar cada palavra do nome
    const capitalizedName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    return `Prof. ${capitalizedName}`
  }

  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <Link href="/dashboard">
            <h1 className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">
              PlanIA
            </h1>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/disciplines">
            <Button variant="ghost">Disciplinas</Button>
          </Link>
          <Link href="/plans">
            <Button variant="ghost">Planos</Button>
          </Link>
          <div className="flex items-center gap-2 ml-4 pl-4 border-l">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{formatName(user?.name)}</span>
              <span className="text-xs text-muted-foreground">{user?.email || "Ciências Exatas"}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {getInitials(user?.name)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
