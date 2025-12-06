"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, GripVertical, Lock } from "lucide-react"
import { DiaryContent } from "@/services/api"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Props do componente DiaryContentTable
 */
export interface DiaryContentTableProps {
  /** Dados do conteúdo do diário */
  contents: DiaryContent[]
  
  /** Callback quando o conteúdo é reordenado (apenas conteúdo muda, data/horário/tipo ficam fixos) */
  onReorder?: (reorderedContents: DiaryContent[]) => void
  
  /** Classe CSS adicional */
  className?: string
}

/**
 * Conteúdo sortable (apenas o texto do conteúdo)
 */
function SortableContentCell({ content, contentId }: { content: string, contentId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contentId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="max-w-md text-sm flex-1">
        {content || <span className="text-muted-foreground italic">Sem conteúdo</span>}
      </div>
    </div>
  )
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const day = date.getUTCDate().toString().padStart(2, '0')
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
}

const getTypeLabel = (type: 'N' | 'A' | 'R') => {
  switch (type) {
    case 'N': return 'Normal'
    case 'A': return 'Antecipação'
    case 'R': return 'Reposição'
    default: return type
  }
}

const getTypeColor = (type: 'N' | 'A' | 'R') => {
  switch (type) {
    case 'N': return 'bg-blue-50 text-blue-700 border-blue-300'
    case 'A': return 'bg-green-50 text-green-700 border-green-300'
    case 'R': return 'bg-yellow-50 text-yellow-700 border-yellow-300'
    default: return 'bg-gray-50 text-gray-700 border-gray-300'
  }
}

/**
 * Componente de tabela para conteúdo do diário com drag-and-drop
 * Apenas o conteúdo pode ser reordenado, data/horário/tipo ficam fixos
 */
export function DiaryContentTable({
  contents,
  onReorder,
  className = ""
}: DiaryContentTableProps) {
  // Mantém array de conteúdos separado para drag-and-drop
  const [contentTexts, setContentTexts] = useState(contents.map(c => ({ id: c.id, content: c.content || '' })))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setContentTexts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const reorderedTexts = arrayMove(items, oldIndex, newIndex)
        
        // Criar novo array com conteúdos trocados mas mantendo data/horário/tipo originais
        const newContents = contents.map((original, index) => ({
          ...original,
          content: reorderedTexts[index].content
        }))
        
        // Chamar callback se fornecido
        onReorder?.(newContents)
        
        return reorderedTexts
      })
    }
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b">
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário</th>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conteúdo</th>
            </tr>
          </thead>
          <tbody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={contentTexts.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {contents.map((item, index) => {
                  // Verificar se esta aula normal tem uma antecipação correspondente
                  const hasAnticipation = !item.isAntecipation && contents.some(
                    c => c.isAntecipation && c.originalContentId === item.contentId
                  )
                  
                  // Verificar se a linha anterior é a antecipação desta aula
                  const isConnectedToAbove = index > 0 && 
                    hasAnticipation && 
                    contents[index - 1].isAntecipation && 
                    contents[index - 1].originalContentId === item.contentId
                  
                  // Verificar se a linha seguinte é a aula original desta antecipação
                  const isConnectedToBelow = item.isAntecipation && 
                    index < contents.length - 1 &&
                    contents[index + 1].contentId === item.originalContentId
                  
                  return (
                  <tr 
                    key={item.id} 
                    className={`border-b transition-colors ${
                      item.isAntecipation ? 'bg-green-50/70' : hasAnticipation ? 'bg-gray-50' : ''
                    } ${isConnectedToAbove ? 'border-l-4 border-l-green-400 border-t-0' : ''} ${
                      isConnectedToBelow ? 'border-l-4 border-l-green-400 border-b-0' : ''
                    } ${hasAnticipation ? 'opacity-60' : ''} hover:brightness-95`}
                  >
                    {/* ID do Conteúdo */}
                    <td className="p-3">
                      <div className={`flex items-center gap-1 ${isConnectedToAbove ? 'pl-4' : ''}`}>
                        {isConnectedToAbove && (
                          <span className="text-green-500 mr-1 font-bold">└─</span>
                        )}
                        {item.isAntecipation && (
                          <span className="text-green-500 mr-1">🔄</span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">{item.contentId}</span>
                        {item.isAntecipation && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-400 text-[10px] px-1.5 py-0.5 font-semibold">
                            Antecipada
                          </Badge>
                        )}
                        {hasAnticipation && (
                          <Badge variant="outline" className="bg-gray-200 text-gray-600 border-gray-400 text-[10px] px-1.5 py-0.5 no-underline">
                            Cancelada
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Data (fixo) */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(item.date)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Horário (fixo) */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{item.timeRange}</span>
                        </div>
                      </div>
                    </td>

                    {/* Tipo (fixo) */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={`${getTypeColor(item.type)} text-xs font-medium`}>
                          {getTypeLabel(item.type)}
                        </Badge>
                        {item.isAntecipation && item.originalDate && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-500">Original:</span>
                            <span className="text-[10px] text-gray-600 font-medium">{formatDate(item.originalDate)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Conteúdo (sortable) */}
                    <td className="p-3">
                      <SortableContentCell 
                        content={contentTexts[index]?.content || ''} 
                        contentId={contentTexts[index]?.id || item.id}
                      />
                    </td>
                  </tr>
                  )
                })}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>

      {contents.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Nenhum conteúdo encontrado</p>
        </div>
      )}
    </Card>
  )
}
