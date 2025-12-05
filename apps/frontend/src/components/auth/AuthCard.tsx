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
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
