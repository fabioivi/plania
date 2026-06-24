"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Send, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  BookOpen
} from "lucide-react"
import { 
  DiaryContent, 
  academicApi,
  DiaryWithPlans,
  TeachingPlan
} from "@/services/api"
import { DiaryContentTable } from "@/components/diary/DiaryContentTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function GenerateDiaryContentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const diaryId = params.id as string
  const initialPlanId = searchParams.get('planId')
  
  const queryClient = useQueryClient()

  const [diary, setDiary] = useState<DiaryWithPlans | null>(null)
  const [teachingPlans, setTeachingPlans] = useState<TeachingPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || '')
  const [generatedContents, setGeneratedContents] = useState<DiaryContent[]>([])
  
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados para a funcionalidade de Preenchimento Rápido
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [bulkField, setBulkField] = useState<'isEad' | 'isNonPresential'>('isEad')
  const [bulkDayOfWeek, setBulkDayOfWeek] = useState<number>(1)
  const [bulkTimeRange, setBulkTimeRange] = useState<string | 'all' | '1' | '2' | '3' | '4'>('all')
  const [bulkAction, setBulkAction] = useState<boolean>(true)

  const availableDaysOfWeek = useMemo(() => {
    const days = new Set<number>()
    generatedContents.forEach(c => {
      if (c.date) {
        const dateObj = new Date(c.date)
        const dayOfWeek = dateObj.getUTCDay()
        days.add(dayOfWeek)
      }
    })

    const dayLabels: Record<number, string> = {
      1: 'Segunda-feira',
      2: 'Terça-feira',
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado',
      0: 'Domingo',
    }

    return Array.from(days)
      .sort((a, b) => {
        const sortOrder = [1, 2, 3, 4, 5, 6, 0]
        return sortOrder.indexOf(a) - sortOrder.indexOf(b)
      })
      .map(d => ({
        value: d,
        label: dayLabels[d] || 'Dia Desconhecido',
      }))
  }, [generatedContents])

  // Ajustar o dia da semana padrão de acordo com os dias reais que possuem aula
  useEffect(() => {
    if (availableDaysOfWeek.length > 0 && !availableDaysOfWeek.some(d => d.value === bulkDayOfWeek)) {
      setBulkDayOfWeek(availableDaysOfWeek[0].value)
    }
  }, [availableDaysOfWeek, bulkDayOfWeek])

  const uniqueTimeRanges = useMemo(() => {
    const slots = new Set<string>()
    generatedContents.forEach(c => {
      if (c.timeRange) slots.add(c.timeRange)
    })
    return Array.from(slots).sort()
  }, [generatedContents])

  const handleApplyBulkRule = () => {
    // Mapear e atualizar o status nas aulas correspondentes
    const updated = generatedContents.map(item => {
      const dateObj = new Date(item.date)
      const dayOfWeek = dateObj.getUTCDay()
      const isCorrectDay = dayOfWeek === bulkDayOfWeek

      if (!isCorrectDay) return item

      // Validar horário da aula
      let isCorrectTime = false
      if (bulkTimeRange === 'all') {
        isCorrectTime = true
      } else {
        isCorrectTime = item.timeRange === bulkTimeRange
      }

      if (isCorrectTime) {
        return {
          ...item,
          [bulkField]: bulkAction
        }
      }

      return item
    })

    setGeneratedContents(updated)
    setIsBulkDialogOpen(false)
    toast.success('Preenchimento rápido aplicado com sucesso!')
  }

  // Carregar diário e planos de ensino
  useEffect(() => {
    loadData()
  }, [diaryId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar diário com planos vinculados
      const diaryData = await academicApi.getDiaryWithPlans(diaryId)
      setDiary(diaryData)

      // Os planos já vêm vinculados no DiaryWithPlans
      setTeachingPlans(diaryData.teachingPlans || [])

      // Se tem planId inicial, carregar conteúdo
      if (initialPlanId) {
        await handleGenerate(initialPlanId)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (planId?: string) => {
    const targetPlanId = planId || selectedPlanId
    if (!targetPlanId) {
      setError('Selecione um plano de ensino')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      setSuccess(null)

      const result = await academicApi.generateDiaryContentFromPlan(diaryId, targetPlanId)
      
      if (result.success && result.contents) {
        setGeneratedContents(result.contents)
        setSuccess(`Conteúdo gerado com sucesso! ${result.generatedCount} aulas preenchidas.`)
      } else {
        setError('Erro ao gerar conteúdo')
      }
    } catch (err) {
      console.error('Erro ao gerar conteúdo:', err)
      setError('Erro ao gerar conteúdo. Por favor, tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  const handleContentChange = (contentId: string, field: string, value: any) => {
    setGeneratedContents(prev =>
      prev.map(item =>
        item.id === contentId ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSave = async () => {
    if (generatedContents.length === 0) {
      setError('Nenhum conteúdo para salvar')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const result = await academicApi.saveDiaryContentBulk(diaryId, generatedContents)

      if (result.success) {
        // Invalidate React Query cache for this diary to ensure pages show fresh data immediately
        queryClient.invalidateQueries({ queryKey: ['diaries', 'detail', diaryId] })

        setSuccess(`${result.savedCount} conteúdos salvos com sucesso!`)
        
        // Redirecionar para a página do diário após 2 segundos
        setTimeout(() => {
          router.push(`/diaries/${diaryId}`)
        }, 2000)
      } else {
        setError('Erro ao salvar conteúdos')
      }
    } catch (err) {
      console.error('Erro ao salvar conteúdos:', err)
      setError('Erro ao salvar conteúdos. Por favor, tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleSendToIFMS = () => {
    // Placeholder para integração futura com IFMS
    alert('Funcionalidade de envio ao IFMS em desenvolvimento')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Gerar Conteúdo do Diário
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha automaticamente o diário a partir de um plano de ensino
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Diário */}
      {diary && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Calendar className="h-6 w-6 text-primary mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{diary.disciplina}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">ID: {diary.externalId}</Badge>
                {diary.periodo && <Badge variant="outline">Período: {diary.periodo}</Badge>}
                {diary.turma && <Badge variant="outline">Turma: {diary.turma}</Badge>}
                {diary.curso && <Badge variant="outline">Curso: {diary.curso}</Badge>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Seleção do Plano de Ensino */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Selecione o Plano de Ensino</h3>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                disabled={generating || teachingPlans.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano de ensino" />
                </SelectTrigger>
                <SelectContent>
                  {teachingPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.unidadeCurricular} - {plan.anoSemestre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teachingPlans.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhum plano de ensino vinculado a este diário
                </p>
              )}
            </div>

            <Button
              onClick={() => handleGenerate()}
              disabled={!selectedPlanId || generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Conteúdo
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Sucesso</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabela de Conteúdo Editável */}
      {generatedContents.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Conteúdo Gerado ({generatedContents.filter(c => !c.isAntecipation || (c.isAntecipation && !generatedContents.some(gc => gc.originalContentId === c.contentId))).length} aulas)
                  {generatedContents.some(c => c.isAntecipation) && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}+ {generatedContents.filter(c => c.isAntecipation).length} antecipações
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {generatedContents.some(c => c.isAntecipation) && (
                    <>Nas antecipações, o conteúdo é duplicado automaticamente na aula cancelada original</>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
              <Button
                onClick={() => setIsBulkDialogOpen(true)}
                variant="outline"
                className="gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50"
              >
                <Sparkles className="h-4 w-4" />
                Preenchimento Rápido (EAD/ANP)
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>

              <Button
                onClick={handleSendToIFMS}
                disabled={true}
                variant="outline"
                className="gap-2"
                title="Funcionalidade em desenvolvimento"
              >
                <Send className="h-4 w-4" />
                Enviar ao IFMS
              </Button>
            </div>
            </div>
          </div>

          <DiaryContentTable
            contents={generatedContents}
            editable={true}
            onContentChange={handleContentChange}
          />
        </>
      )}

      {/* Estado vazio */}
      {!generating && generatedContents.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground space-y-2">
            <Sparkles className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg">Selecione um plano de ensino e clique em &quot;Gerar Conteúdo&quot;</p>
            <p className="text-sm">O conteúdo do plano será mapeado automaticamente para as datas do diário</p>
          </div>
        </Card>
      )}

      {/* Modal de Preenchimento Rápido */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Preenchimento Rápido (EAD/ANP)
            </DialogTitle>
            <DialogDescription>
              Marque ou desmarque aulas como EAD ou ANP em lote, de acordo com o dia da semana e o horário correspondente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                Campo de Aula
              </label>
              <Select
                value={bulkField}
                onValueChange={(val: 'isEad' | 'isNonPresential') => setBulkField(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isEad">EAD (Aula a Distância)</SelectItem>
                  <SelectItem value="isNonPresential">ANP (Aula Não Presencial)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dia da Semana */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                Dia da Semana
              </label>
              <Select
                value={String(bulkDayOfWeek)}
                onValueChange={(val) => setBulkDayOfWeek(Number(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {availableDaysOfWeek.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                Horário da Aula
              </label>
              <Select
                value={bulkTimeRange}
                onValueChange={(val) => setBulkTimeRange(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os horários do dia</SelectItem>
                  {uniqueTimeRanges.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ação */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                Ação
              </label>
              <div className="flex rounded-md bg-slate-100 dark:bg-zinc-800 p-1">
                <button
                  type="button"
                  onClick={() => setBulkAction(true)}
                  className={`flex-1 rounded-sm py-1.5 text-xs font-bold transition-all ${
                    bulkAction
                      ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-foreground shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Marcar / Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction(false)}
                  className={`flex-1 rounded-sm py-1.5 text-xs font-bold transition-all ${
                    !bulkAction
                      ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-foreground shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Desmarcar / Inativo
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyBulkRule} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
              <Sparkles className="h-4 w-4" />
              Aplicar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
