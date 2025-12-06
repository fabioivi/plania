'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, GripVertical, Lock, AlertCircle } from "lucide-react"
import { DiaryContent } from "@/services/api"

interface DiaryContentReorderableProps {
  contents: DiaryContent[]
  onReorder?: (reorderedContents: DiaryContent[]) => void
}

// Componente de item individual (arrastável)
function SortableDiaryItem({ item }: { item: DiaryContent }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getUTCDate().toString().padStart(2, '0')
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  }  const getTypeLabel = (type: 'N' | 'A' | 'R') => {
    switch (type) {
      case 'N': return 'Normal'
      case 'A': return 'Antecipação'
      case 'R': return 'Reposição'
      default: return type
    }
  }

  const getTypeColor = (type: 'N' | 'A' | 'R') => {
    switch (type) {
      case 'N': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'A': return 'bg-green-100 text-green-800 border-green-300'
      case 'R': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`hover:border-primary/50 transition-colors ${isDragging ? 'shadow-lg' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1 touch-none"
              aria-label="Arrastar item"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </button>

            <div className="flex-1">
              {/* Badges de tipo */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={getTypeColor(item.type)}>
                  {getTypeLabel(item.type)}
                </Badge>
                {item.isNonPresential && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                    Não Presencial
                  </Badge>
                )}
                {item.isAntecipation && item.originalDate && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
                    Original: {formatDate(item.originalDate)}
                  </Badge>
                )}
              </div>

              {/* Data e Horário (FIXOS - não editáveis) */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{formatDate(item.date)}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{item.timeRange}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {item.content && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold mb-2">Conteúdo Ministrado:</h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                {item.content}
              </p>
            </div>
          )}
          {item.observations && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Observações:</h4>
              <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md border border-yellow-200">
                {item.observations}
              </p>
            </div>
          )}
          {!item.content && !item.observations && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Sem conteúdo ou observações registradas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal
export function DiaryContentReorderable({ 
  contents, 
  onReorder 
}: DiaryContentReorderableProps) {
  const [items, setItems] = useState(contents)

  // Configurar sensores (mouse, touch, keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento antes de iniciar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const reordered = arrayMove(items, oldIndex, newIndex)
        
        // Callback para salvar nova ordem
        onReorder?.(reordered)
        
        return reordered
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0">
          {items.map((item) => (
            <SortableDiaryItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
