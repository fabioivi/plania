"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

/**
 * Tipo para representar uma semana no cronograma
 */
export type WeekSchedule = {
  id: string
  week?: number
  month: string
  period: string
  classes: number
  observations?: string
  content: string
  teachingTechniques: string
  teachingResources?: string
}

/**
 * Props do componente WorkProposalTable
 */
export interface WorkProposalTableProps {
  /** Dados das semanas do cronograma */
  data: WeekSchedule[]
  
  /** Mostrar coluna de checkbox para seleção */
  showCheckbox?: boolean
  
  /** Mostrar coluna de ações (editar/excluir) */
  showActions?: boolean
  
  /** Callback quando o botão de editar é clicado */
  onEdit?: (week: WeekSchedule) => void
  
  /** Callback quando o botão de excluir é clicado */
  onDelete?: (week: WeekSchedule) => void
  
  /** Classe CSS adicional */
  className?: string
}

/**
 * Componente reutilizável para exibir tabela de proposta de trabalho (cronograma)
 * com design padronizado e badges coloridos
 */
export function WorkProposalTable({
  data,
  showCheckbox = false,
  showActions = false,
  onEdit,
  onDelete,
  className = ""
}: WorkProposalTableProps) {
  
  // Construir colunas dinamicamente baseado nas props
  const columns: ColumnDef<WeekSchedule>[] = []

  // Coluna de seleção (opcional)
  if (showCheckbox) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todas"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    })
  }

  // Coluna de período (mês + período)
  columns.push({
    id: "period",
    header: "Período",
    cell: ({ row }) => {
      const monthFull = row.original.month.split(" - ")[1] || row.original.month
      return (
        <div className="text-sm">
          <div className="font-medium">{monthFull}</div>
          <div className="text-sm">{row.original.period}</div>
        </div>
      )
    },
  })

  // Coluna de número de aulas
  columns.push({
    accessorKey: "classes",
    header: "Nº Aulas",
    cell: ({ row }) => (
      <Badge>{row.getValue("classes")}</Badge>
    ),
  })

  // Coluna de observações
  columns.push({
    accessorKey: "observations",
    header: "Observações",
    cell: ({ row }) => {
      const obs = row.getValue("observations") as string
      return obs ? (
        <Badge variant="secondary" className="text-xs">{obs}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
  })

  // Coluna de conteúdo
  columns.push({
    accessorKey: "content",
    header: "Conteúdo",
    cell: ({ row }) => (
      <div className="w-48 text-sm whitespace-normal">
        {row.getValue("content")}
      </div>
    ),
  })

  // Coluna de técnicas de ensino (badges azuis)
  columns.push({
    accessorKey: "teachingTechniques",
    header: "Técnicas de Ensino",
    cell: ({ row }) => {
      const techniques = (row.getValue("teachingTechniques") as string).split(", ")
      return (
        <div className="flex gap-1.5 flex-wrap max-w-xs">
          {techniques.map((technique, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
            >
              {technique}
            </Badge>
          ))}
        </div>
      )
    },
  })

  // Coluna de recursos de ensino (badges verdes) - apenas se existir
  columns.push({
    accessorKey: "teachingResources",
    header: "Recursos de Ensino",
    cell: ({ row }) => {
      const resources = row.getValue("teachingResources") as string
      if (!resources) return <span className="text-muted-foreground text-xs">-</span>
      
      const resourceList = resources.split(", ")
      return (
        <div className="flex gap-1.5 flex-wrap max-w-xs">
          {resourceList.map((resource, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
            >
              {resource}
            </Badge>
          ))}
        </div>
      )
    },
  })

  // Coluna de ações (opcional)
  if (showActions) {
    columns.push({
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
    })
  }

  return (
    <div className={className}>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
