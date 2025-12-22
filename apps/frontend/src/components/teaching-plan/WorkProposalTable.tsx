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
    header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Período</span>,
    accessorFn: (row) => `${row.month} ${row.period}`,
    cell: ({ row }) => {
      const monthFull = row.original.month.split(" - ")[1] || row.original.month
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-700 dark:text-foreground">{monthFull}</span>
          <span className="text-xs font-medium text-slate-400 dark:text-muted-foreground uppercase tracking-wide">{row.original.period}</span>
        </div>
      )
    },
    enableGlobalFilter: true,
  })

  // Coluna de número de aulas
  columns.push({
    accessorKey: "classes",
    header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Aulas</span>,
    cell: ({ row }) => (
      <div className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-lg inline-block border border-indigo-200 dark:border-indigo-800 min-w-[3rem] text-center shadow-sm">
        {row.getValue("classes")}
      </div>
    ),
    enableGlobalFilter: true,
  })

  // Coluna de conteúdo
  columns.push({
    accessorKey: "content",
    header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Conteúdo Programático</span>,
    cell: ({ row }) => (
      <div className="max-w-[350px] text-sm text-slate-600 dark:text-muted-foreground leading-relaxed font-medium">
        {row.getValue("content")}
      </div>
    ),
    enableGlobalFilter: true,
  })

  // Coluna de técnicas de ensino (badges azuis)
  columns.push({
    accessorKey: "teachingTechniques",
    header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Técnicas</span>,
    cell: ({ row }) => {
      const techniques = (row.getValue("teachingTechniques") as string).split(", ")
      return (
        <div className="flex gap-1.5 flex-wrap max-w-[200px]">
          {techniques.map((technique, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-[10px] font-semibold uppercase tracking-wide rounded-md px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              {technique}
            </Badge>
          ))}
        </div>
      )
    },
    enableGlobalFilter: true,
  })

  // Coluna de recursos de ensino (badges verdes) - apenas se existir
  columns.push({
    accessorKey: "teachingResources",
    header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Recursos</span>,
    cell: ({ row }) => {
      const resources = row.getValue("teachingResources") as string
      if (!resources) return <span className="text-slate-300 dark:text-muted-foreground text-xs">-</span>

      const resourceList = resources.split(", ")
      return (
        <div className="flex gap-1.5 flex-wrap max-w-[200px]">
          {resourceList.map((resource, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-[10px] font-semibold uppercase tracking-wide rounded-md px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              {resource}
            </Badge>
          ))}
        </div>
      )
    },
    enableGlobalFilter: true,
  })

  // Coluna de observações
  columns.push({
    accessorKey: "observations",
    header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Obs.</span>,
    cell: ({ row }) => {
      const obs = row.getValue("observations") as string
      return obs ? (
        <div className="text-xs text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-2 py-1 rounded-md max-w-[150px]">
          {obs}
        </div>
      ) : (
        <span className="text-slate-200 text-xs">-</span>
      )
    },
    enableGlobalFilter: true,
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
