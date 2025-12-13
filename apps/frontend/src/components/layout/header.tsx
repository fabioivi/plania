'use client'

import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"

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

  const Logo = () => (
    <Link href="/dashboard" className="flex items-center gap-2">
      <GraduationCap className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">
        PlanIA
      </h1>
    </Link>
  )

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
      if (path === '/dashboard') return pathname === '/dashboard'
      return pathname.startsWith(path)
    }

    const getVariant = (path: string) => isActive(path) ? "secondary" : "ghost"
    const getClassName = (path: string) => {
      const baseClass = mobile ? "w-full justify-start" : ""
      const activeClass = isActive(path) ? "bg-accent/50 font-medium" : ""
      return `${baseClass} ${activeClass}`
    }

    return (
      <>
        <Link href="/dashboard" className={mobile ? "w-full" : ""}>
          <Button variant={getVariant('/dashboard')} className={getClassName('/dashboard')}>Dashboard</Button>
        </Link>
        <Link href="/disciplines" className={mobile ? "w-full" : ""}>
          <Button variant={getVariant('/disciplines')} className={getClassName('/disciplines')}>Disciplinas</Button>
        </Link>
        <Link href="/plans" className={mobile ? "w-full" : ""}>
          <Button variant={getVariant('/plans')} className={getClassName('/plans')}>Planos</Button>
        </Link>
        <Link href="/settings" className={mobile ? "w-full" : ""}>
          <Button variant={getVariant('/settings')} className={getClassName('/settings')}>Configurações</Button>
        </Link>
      </>
    )
  }

  const UserMenu = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex items-center gap-2 ${mobile ? "mt-auto pt-4 border-t w-full justify-between" : "ml-4 pl-4 border-l"}`}>
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {getInitials(user?.name)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{formatName(user?.name)}</span>
          <span className="text-xs text-muted-foreground">{user?.email || "Ciências Exatas"}</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <header className="border-b sticky top-0 bg-background z-10 w-full">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLinks />
          <UserMenu />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-4">
              <div className="mt-4 flex flex-col gap-2">
                <NavLinks mobile />
              </div>
              <UserMenu mobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
