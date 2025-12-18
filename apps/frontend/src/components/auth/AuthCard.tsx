import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ReactNode } from "react"

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="shadow-2xl shadow-purple-900/10 border border-white/20 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl">
      <CardHeader className="space-y-1 text-center pb-8 pt-6">
        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">{title}</CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400 text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 sm:px-8">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="pb-6 px-6 sm:px-8 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800/50 rounded-b-3xl pt-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
