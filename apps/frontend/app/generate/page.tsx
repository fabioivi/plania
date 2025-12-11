"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { WorkProposalTable, WeekSchedule } from "@/components/teaching-plan/WorkProposalTable"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { academicApi, Diary, TeachingPlan, aiApi, GeneratedTeachingPlan } from "@/services/api"
import { toast } from "sonner"

export default function GeneratePage() {
  const searchParams = useSearchParams()
  const diaryId = searchParams.get('diaryId')
  
  const [step, setStep] = useState<"config" | "generating" | "success">("config")
  const [loading, setLoading] = useState(true)
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null)
  const [existingPlans, setExistingPlans] = useState<TeachingPlan[]>([])
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedTeachingPlan | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  
  const [formData, setFormData] = useState({
    diaryId: "",
    objectives: "",
    methodology: "",
    additionalNotes: ""
  })

  useEffect(() => {
    loadDiaries()
  }, [])

  useEffect(() => {
    if (diaryId && diaries.length > 0) {
      const diary = diaries.find(d => d.id === diaryId)
      if (diary) {
        selectDiary(diary)
      }
    }
  }, [diaryId, diaries])

  const loadDiaries = async () => {
    try {
      setLoading(true)
      const data = await academicApi.getDiaries()
      setDiaries(data)
    } catch (err: any) {
      console.error('Erro ao carregar diários:', err)
      toast.error('Erro ao carregar disciplinas')
    } finally {
      setLoading(false)
    }
  }

  const selectDiary = async (diary: Diary) => {
    setSelectedDiary(diary)
    setFormData(prev => ({ ...prev, diaryId: diary.id }))
    
    // Load existing teaching plans for reference
    try {
      const plans = await academicApi.getDiaryTeachingPlans(diary.id)
      setExistingPlans(plans)
    } catch (err) {
      console.error('Erro ao carregar planos existentes:', err)
    }
  }

  const handleGenerate = async () => {
    if (!formData.diaryId) {
      toast.error('Selecione uma disciplina')
      return
    }

    setStep("generating")
    setGenerationProgress(0)
    setGenerationMessage('Iniciando geração...')

    try {
      // Connect to SSE for real-time progress
      const token = localStorage.getItem('token')
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/teaching-plans/generate/${formData.diaryId}?token=${token}`
      )

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE message:', data)

          if (data.type === 'progress') {
            setGenerationProgress(data.progress)
            setGenerationMessage(data.message)
          } else if (data.type === 'complete') {
            setGenerationProgress(100)
            setGenerationMessage(data.message)
            setGeneratedPlan(data.plan)
            setStep("success")
            eventSource.close()
            toast.success('Plano gerado com sucesso!')
          } else if (data.type === 'error') {
            toast.error(data.message)
            setStep("config")
            eventSource.close()
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        toast.error('Erro na conexão com servidor')
        setStep("config")
        eventSource.close()
      }
    } catch (err: any) {
      console.error('Erro ao gerar plano:', err)
      toast.error(err.response?.data?.message || 'Erro ao gerar plano')
      setStep("config")
    }
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        {/* Configuration Step */}
        {step === "config" && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Gerar Plano com IA</h1>
              </div>
              <p className="text-muted-foreground">
                Configure os parâmetros e deixe a IA criar um plano de ensino completo e personalizado
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configuração do Plano</CardTitle>
                <CardDescription>
                  {selectedDiary 
                    ? `Gerando plano para ${selectedDiary.disciplina}`
                    : 'Selecione uma disciplina e configure os parâmetros para gerar um plano personalizado'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Discipline Selection */}
                <div className="space-y-2">
                  <Label htmlFor="discipline">Disciplina *</Label>
                  {loading ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando disciplinas...</span>
                    </div>
                  ) : (
                    <Select 
                      value={formData.diaryId}
                      onValueChange={(value) => {
                        const diary = diaries.find(d => d.id === value)
                        if (diary) selectDiary(diary)
                      }}
                    >
                      <SelectTrigger id="discipline">
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {diaries.map((diary) => (
                          <SelectItem key={diary.id} value={diary.id}>
                            {diary.disciplina} - {diary.turma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Disciplinas sincronizadas do sistema acadêmico
                  </p>
                </div>

                {/* Show diary info when selected */}
                {selectedDiary && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Curso:</span>
                        <p className="font-medium">{selectedDiary.curso}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Turma:</span>
                        <p className="font-medium">{selectedDiary.turma}</p>
                      </div>
                      {selectedDiary.periodo && (
                        <div>
                          <span className="text-muted-foreground">Período:</span>
                          <p className="font-medium">{selectedDiary.periodo}</p>
                        </div>
                      )}
                      {selectedDiary.cargaHoraria && (
                        <div>
                          <span className="text-muted-foreground">Carga Horária:</span>
                          <p className="font-medium">{selectedDiary.cargaHoraria}</p>
                        </div>
                      )}
                      {selectedDiary.anoLetivo && (
                        <div>
                          <span className="text-muted-foreground">Ano Letivo:</span>
                          <p className="font-medium">{selectedDiary.anoLetivo}{selectedDiary.semestre ? `.${selectedDiary.semestre}` : ''}</p>
                        </div>
                      )}
                      {selectedDiary.modalidade && (
                        <div>
                          <span className="text-muted-foreground">Modalidade:</span>
                          <p className="font-medium">{selectedDiary.modalidade}</p>
                        </div>
                      )}
                    </div>
                    {existingPlans.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          ℹ️ {existingPlans.length} plano(s) de ensino existente(s) será(ão) usado(s) como referência
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Objectives */}
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos de Aprendizagem (Opcional)</Label>
                  <Textarea 
                    id="objectives"
                    placeholder="Ex: Desenvolver habilidades analíticas para resolver problemas de cálculo diferencial..."
                    rows={4}
                    value={formData.objectives}
                    onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    A IA pode sugerir objetivos se deixado em branco
                  </p>
                </div>

                {/* Methodology */}
                <div className="space-y-2">
                  <Label htmlFor="methodology">Metodologia Preferida (Opcional)</Label>
                  <Select 
                    value={formData.methodology}
                    onValueChange={(value) => setFormData({...formData, methodology: value})}
                  >
                    <SelectTrigger id="methodology">
                      <SelectValue placeholder="Selecione ou deixe a IA decidir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tradicional">Aulas Expositivas Tradicionais</SelectItem>
                      <SelectItem value="ativa">Metodologias Ativas</SelectItem>
                      <SelectItem value="hibrida">Híbrida (Presencial + EAD)</SelectItem>
                      <SelectItem value="projetos">Aprendizagem Baseada em Projetos</SelectItem>
                      <SelectItem value="problemas">Aprendizagem Baseada em Problemas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações Adicionais (Opcional)</Label>
                  <Textarea 
                    id="notes"
                    placeholder="Ex: Enfatizar aplicações práticas, incluir laboratórios, seguir diretrizes do MEC..."
                    rows={3}
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleGenerate}
                    disabled={!formData.diaryId}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar Plano com IA
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <Card className="w-full max-w-2xl">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <Loader2 className="relative h-20 w-20 text-primary animate-spin" />
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Gerando seu plano de ensino...</h2>
                    <p className="text-muted-foreground">
                      {generationMessage}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      {generationProgress}% concluído
                    </p>
                  </div>

                  {/* Current Step */}
                  <div className="w-full max-w-md pt-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                      <p className="text-sm text-left">{generationMessage}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && generatedPlan && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <h1 className="text-3xl font-bold">Plano Gerado com Sucesso!</h1>
              </div>
              <p className="text-muted-foreground">
                Revise o conteúdo gerado pela IA antes de salvar
              </p>
            </div>

            <div className="space-y-6">
              {/* Info Card */}
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Plano de Ensino Gerado</h3>
                      <p className="text-sm text-muted-foreground">
                        A IA gerou o conteúdo pedagógico baseado na ementa e referências do sistema IFMS. 
                        Dados preservados: <strong>ementa, carga horária, datas e referências bibliográficas</strong>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Discipline Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Disciplina</CardTitle>
                  <CardDescription>Dados do Sistema IFMS (preservados)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Disciplina</Label>
                      <p className="font-medium">{selectedDiary?.disciplina}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Período</Label>
                      <p className="font-medium">{selectedDiary?.anoLetivo}.{selectedDiary?.semestre}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Curso</Label>
                      <p className="font-medium">{selectedDiary?.curso}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Carga Horária</Label>
                      <p className="font-medium">{selectedDiary?.cargaHoraria} horas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Conteúdo Gerado pela IA
                  </CardTitle>
                  <CardDescription>Objetivos, metodologia e proposta de trabalho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Objetivo Geral */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Objetivo Geral</Label>
                    <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm">{generatedPlan.objetivoGeral}</p>
                    </div>
                  </div>

                  {/* Objetivos Específicos */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Objetivos Específicos</Label>
                    <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-line">{generatedPlan.objetivosEspecificos}</p>
                    </div>
                  </div>

                  {/* Metodologia */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Metodologia</Label>
                    <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-line">{generatedPlan.metodologia}</p>
                    </div>
                  </div>

                  {/* Avaliação */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Avaliação de Aprendizagem</Label>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      {generatedPlan.avaliacaoAprendizagem?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="font-medium text-sm">{item.tipo}:</span>
                          <span className="text-sm text-muted-foreground">{item.descricao} ({item.peso}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recuperação */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Recuperação de Aprendizagem</Label>
                    <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-line">{generatedPlan.recuperacaoAprendizagem}</p>
                    </div>
                  </div>

                  {/* Proposta de Trabalho (usa componente reutilizável) */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Proposta de Trabalho ({generatedPlan.propostaTrabalho?.length || 0} semanas)
                    </Label>
                    <div>
                      {generatedPlan.propostaTrabalho && (
                        <WorkProposalTable
                          data={generatedPlan.propostaTrabalho.map((semana: any, idx: number) => {
                            // Normaliza campos do plano gerado para o formato WeekSchedule
                            const ws: WeekSchedule = {
                              id: semana.id || `${idx}`,
                              week: semana.semana ?? idx + 1,
                              month: semana.mes || (semana.datas || '').split('-')[0] || '',
                              period: semana.datas || '',
                              classes: semana.horasAula ?? semana.numAulas ?? 1,
                              observations: semana.observacoes || semana.observacao || '',
                              content: semana.tema || semana.conteudo || semana.assunto || '',
                              teachingTechniques: Array.isArray(semana.tecnicasEnsino)
                                ? semana.tecnicasEnsino.join(', ')
                                : (semana.tecnicasEnsino || semana.tecnicas || semana.tecnica || '').toString(),
                              teachingResources: Array.isArray(semana.recursosEnsino)
                                ? semana.recursosEnsino.join(', ')
                                : (semana.recursosEnsino || semana.recursos || '').toString(),
                            }
                            return ws
                          })}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep("config")
                    setGeneratedPlan(null)
                    setGenerationProgress(0)
                  }}
                >
                  Gerar Novo Plano
                </Button>
                <Button className="gap-2">
                  Salvar e Editar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  )
}
