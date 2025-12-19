"use client"

import { useState, Fragment } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Clock, GripVertical, Edit2 } from "lucide-react"
import { DiaryContent } from "@/services/api"
import { format, parseISO, isSameDay as dateFnsIsSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

  /** Modo de edição inline */
  editable?: boolean

  /** Callback quando o conteúdo é editado */
  onContentChange?: (contentId: string, field: 'content' | 'observations', value: string) => void

  /** Classe CSS adicional */
  className?: string
}

/**
 * Conteúdo sortable (apenas o texto do conteúdo)
 */
function SortableContentCell({
  content,
  contentId,
  editable,
  onEdit
}: {
  content: string
  contentId: string
  editable?: boolean
  onEdit?: (value: string) => void
}) {
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
    position: 'relative' as React.CSSProperties['position'],
    zIndex: isDragging ? 999 : 1, // Ensure content is above row backgrounds, active item even higher
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

      {editable ? (
        <div className="flex-1 max-w-md">
          <Textarea
            value={content}
            onChange={(e) => onEdit?.(e.target.value)}
            className="min-h-[60px] text-sm resize-y"
            placeholder="Digite o conteúdo da aula..."
          />
        </div>
      ) : (
        <div className="max-w-md text-sm flex-1 text-slate-700 dark:text-foreground">
          {content || <span className="text-muted-foreground italic">Sem conteúdo</span>}
        </div>
      )}
    </div>
  )
}

/**
 * Formata data no formato DD/MM/YYYY usando date-fns
 */
const formatDate = (dateStr: string) => {
  try {
    const date = parseISO(dateStr)
    return format(date, 'dd/MM/yyyy')
  } catch (error) {
    console.error('Erro ao formatar data:', dateStr, error)
    return dateStr
  }
}



/**
 * Compara se duas datas são do mesmo dia usando date-fns
 */
const isSameDay = (date1Str: string, date2Str: string) => {
  try {
    const d1 = parseISO(date1Str)
    const d2 = parseISO(date2Str)
    return dateFnsIsSameDay(d1, d2)
  } catch (error) {
    console.error('Erro ao comparar datas:', date1Str, date2Str, error)
    return false
  }
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
    case 'N': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'A': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    case 'R': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    default: return 'bg-slate-50 dark:bg-secondary text-slate-700 dark:text-foreground border-slate-200 dark:border-border'
  }
}



/**
 * Componente de tabela para conteúdo do diário com drag-and-drop
 * Apenas o conteúdo pode ser reordenado, data/horário/tipo ficam fixos
 */
export function DiaryContentTable({
  contents,
  onReorder,
  editable = false,
  onContentChange,
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

  // Filtrar itens visíveis (não cancelados) para o drag-and-drop
  const getVisibleItems = () => {
    return contents.filter(item => {
      const hasAnticipation = !item.isAntecipation && contents.some(
        c => c.isAntecipation && c.originalContentId === item.contentId
      )
      return !hasAnticipation
    })
  }

  const visibleItems = getVisibleItems()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setContentTexts((currentTexts) => {
        // Encontrar índices nos itens VISÍVEIS
        const visibleIds = visibleItems.map(i => i.id)
        const oldVisibleIndex = visibleIds.indexOf(active.id.toString())
        const newVisibleIndex = visibleIds.indexOf(over.id.toString())

        if (oldVisibleIndex === -1 || newVisibleIndex === -1) return currentTexts

        // Obter apenas os conteúdos dos itens visíveis
        const visibleContentTexts = visibleIds.map(id => currentTexts.find(t => t.id === id)!)

        // Reordenar apenas os visíveis
        const reorderedVisibleTexts = arrayMove(visibleContentTexts, oldVisibleIndex, newVisibleIndex)

        // Criar novo array completo misturando os reordenados com os ocultos (que não mudam)
        const finalTexts = contents.map(item => {
          // Se o item é visível, pega o próximo do array reordenado
          if (visibleIds.includes(item.id)) {
            // Qual índice visível ele ocupa agora?
            // NÃO. O slot 'item.id' deve receber o conteúdo que AGORA está na posição correspondente ao item.id nos visíveis?
            // Se item.id era o 1º visível, agora ele deve receber o conteúdo do 1º visível do array reordenado.
            const indexInVisible = visibleIds.indexOf(item.id)
            return {
              id: item.id, // ID do slot não muda
              content: reorderedVisibleTexts[indexInVisible].content // Conteúdo muda
            }
          }

          // Se oculto, mantém o conteúdo original do state atual
          return currentTexts.find(t => t.id === item.id)!
        })

        // Notificar pai com a nova ordem
        const newContents = contents.map(item => ({
          ...item,
          content: finalTexts.find(t => t.id === item.id)?.content || '' // Mapeia pelo ID do slot para pegar o novo conteúdo
        }))

        onReorder?.(newContents)

        return finalTexts
      })
    }
  }

  const handleContentEdit = (contentId: string, newValue: string) => {
    // Atualizar estado local
    setContentTexts(prev =>
      prev.map(item =>
        item.id === contentId ? { ...item, content: newValue } : item
      )
    )

    // Chamar callback se fornecido
    onContentChange?.(contentId, 'content', newValue)
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 dark:bg-[#121214] sticky top-0 z-10">
            <tr className="border-b border-slate-200 dark:border-border">
              <th className="p-4 pl-6 text-left text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider w-[100px]">Data</th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider w-[140px]">Horário</th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider w-[120px]">Tipo</th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Conteúdo</th>
              {editable && (
                <th className="p-4 text-left text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Observações</th>
              )}
            </tr>
          </thead>
          <tbody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {visibleItems.map((item, index) => {
                  // Mapeamento correto do conteúdo: Buscar pelo índice VISÍVEL
                  // O slot 'item.id' é o index-ésimo item visível.
                  // Nós queremos exibir o conteúdo que está na index-ésima posição dos itens visíveis em contentTexts.

                  // Encontrar o conteúdo correspondente a este slot nos textos atuais
                  // Precisamos garantir que pegamos o texto que foi movido para cá.
                  // Se contentTexts foi atualizado no handleDragEnd, então contentTexts.find(t => t.id === item.id) retornará o testo associado a este ID.
                  // Mas no handleDragEnd nós não trocamos os IDs dentro do array, nós trocamos os CONTEÚDOS.
                  // Vamos verificar minha lógica do handleDragEnd acima.
                  // Eu retornei: { id: item.id, content: newContent }.
                  // Então SIM, posso buscar pelo ID.
                  const currentTextObj = contentTexts.find(t => t.id === item.id)

                  // Verificar se a data é diferente da linha anterior (para agrupar por dia)
                  const isDifferentDay = index === 0 || !isSameDay(visibleItems[index - 1].date, item.date)

                  // Calcular rowSpan (quantas aulas no mesmo dia, considerando apenas visíveis)
                  const sameDayCount = visibleItems.filter(c => isSameDay(c.date, item.date)).length

                  // Verificar se é o último item do dia para adicionar borda
                  const isLastOfDay = index === visibleItems.length - 1 || !isSameDay(visibleItems[index + 1].date, item.date)

                  // Formatando data para o calendário visual
                  const dateObj = parseISO(item.date)
                  const day = format(dateObj, 'dd')
                  const month = format(dateObj, 'MMM', { locale: ptBR }).toUpperCase() // JAN, FEV
                  const weekday = format(dateObj, 'EEE', { locale: ptBR }).replace('.', '').toUpperCase() // SEG, TER

                  return (
                    <Fragment key={item.id}>

                      <tr
                        className={`transition-all duration-300 border-0 
                          bg-white dark:bg-card 
                          hover:bg-slate-50 dark:hover:bg-card
                          ${isLastOfDay ? 'border-b border-slate-100 dark:border-border' : ''} group`}
                      >
                        {/* Data e Horário (Calendário Visual com RowSpan) */}
                        {isDifferentDay && (
                          <td
                            className="py-2 pl-6 align-middle border-r border-slate-100/50 dark:border-border/50 bg-white dark:bg-card"
                            rowSpan={sameDayCount}
                          >
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-1.5 w-[70px] shadow-sm dark:shadow-none ring-1 ring-slate-50 dark:ring-border mx-auto group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{month}</span>
                              <span className="text-2xl font-black text-slate-700 dark:text-foreground leading-none mb-0.5">{day}</span>
                              <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide leading-none">{weekday}</span>
                            </div>
                          </td>
                        )}

                        <td className="py-2 px-4 align-top">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-foreground font-medium whitespace-nowrap bg-slate-50 dark:bg-secondary/30 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-border w-fit">
                            <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                            <span className="leading-none">{item.timeRange}</span>
                          </div>
                        </td>

                        {/* Tipo (fixo) */}
                        <td className="py-2 px-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <Badge variant="outline" className={`${getTypeColor(item.type)} text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md`}>
                              {getTypeLabel(item.type)}
                            </Badge>

                            {item.isAntecipation && item.originalDate && (
                              <div className="flex flex-col gap-0.5 mt-1 border-t border-green-200 pt-1">
                                <span className="text-[10px] text-green-600 font-bold uppercase">Original</span>
                                <span className="text-[10px] text-green-700 font-medium">{formatDate(item.originalDate)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Conteúdo (sortable) */}
                        <td className="py-2 px-4 align-top w-full">
                          <SortableContentCell
                            content={currentTextObj?.content || item.content || ''}
                            contentId={item.id}
                            editable={editable}
                            onEdit={(newValue) => handleContentEdit(item.id, newValue)}
                          />
                        </td>

                        {/* Observações (editável apenas em modo edição) */}
                        {editable && (
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Edit2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Textarea
                                value={item.observations || ''}
                                onChange={(e) => onContentChange?.(item.id, 'observations', e.target.value)}
                                className="min-h-[60px] text-sm resize-y"
                                placeholder="Observações adicionais..."
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    </Fragment>
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
