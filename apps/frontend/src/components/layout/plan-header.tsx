import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Save, Send } from "lucide-react"

interface PlanHeaderProps {
  planTitle: string
  planInfo: string
  status: "draft" | "review" | "sent"
}

const statusConfig = {
  draft: {
    label: "Rascunho",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-200"
  },
  review: {
    label: "Em Revisão",
    className: "bg-blue-500/10 text-blue-700 border-blue-200"
  },
  sent: {
    label: "Enviado",
    className: "bg-green-500/10 text-green-700 border-green-200"
  }
}

export function PlanHeader({ planTitle, planInfo, status }: PlanHeaderProps) {
  const statusStyle = statusConfig[status]

  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">PlanIA</h1>
          </div>
          <div className="h-6 w-px bg-border"></div>
          <div>
            <h2 className="font-semibold text-sm">{planTitle}</h2>
            <p className="text-xs text-muted-foreground">{planInfo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusStyle.className}>
            {statusStyle.label}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar
          </Button>
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Enviar ao Sistema
          </Button>
        </div>
      </div>
    </header>
  )
}
