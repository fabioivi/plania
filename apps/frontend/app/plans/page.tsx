import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function PlansPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meus Planos de Ensino</h2>
          <p className="text-muted-foreground">
            Gerencie todos os seus planos de ensino
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Esta página está sendo desenvolvida. Por enquanto, acesse os planos através do Dashboard.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
    </ProtectedRoute>
  )
}
