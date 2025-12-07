"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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

export default function GenerateDiaryContentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const diaryId = params.id as string
  const initialPlanId = searchParams.get('planId')

  const [diary, setDiary] = useState<DiaryWithPlans | null>(null)
  const [teachingPlans, setTeachingPlans] = useState<TeachingPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || '')
  const [generatedContents, setGeneratedContents] = useState<DiaryContent[]>([])
  
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const handleContentChange = (contentId: string, field: 'content' | 'observations', value: string) => {
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
    </div>
  )
}
