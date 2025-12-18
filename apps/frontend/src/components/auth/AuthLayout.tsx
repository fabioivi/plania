import { ReactNode } from "react"
import { Sparkles } from "lucide-react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-purple-500/30">

      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -z-10 opacity-30 dark:opacity-20 translate-x-1/3 -translate-y-1/4 pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-[100px] animate-pulse-slow" />
      </div>
      <div className="absolute bottom-0 left-0 -z-10 opacity-30 dark:opacity-20 -translate-x-1/3 translate-y-1/4 pointer-events-none">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg shadow-blue-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
            PlanIA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">
            Planejamento acadêmico com inteligência
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
