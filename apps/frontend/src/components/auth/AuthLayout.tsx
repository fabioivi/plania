import { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">PlanIA</h1>
          <p className="text-muted-foreground">AI-Powered Teaching Platform</p>
        </div>
        
        {children}
      </div>
    </div>
  )
}
