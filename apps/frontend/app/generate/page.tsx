"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { toast } from "sonner"
import { useDiaries, useTeachingPlan, useSaveAITeachingPlan } from "@/hooks/api"

function GeneratePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const diaryId = searchParams.get('diaryId')
  const planId = searchParams.get('planId') // Base plan to use for generation

  // React Query hooks
  const { data: diaries = [] } = useDiaries()
  const { data: basePlan } = useTeachingPlan(planId || undefined)
  const { mutate: savePlan } = useSaveAITeachingPlan()

  const [step, setStep] = useState<"config" | "generating">("config")
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')

  const [formData, setFormData] = useState({
    diaryId: diaryId || "",
    basePlanId: planId || "",
    methodology: "",
    additionalNotes: ""
  })

  // Auto-select diary from URL parameter
  useEffect(() => {
    if (diaryId && diaries.length > 0) {
      setFormData(prev => ({ ...prev, diaryId }))
    }
  }, [diaryId, diaries])

  // Auto-set basePlanId when base plan is loaded
  useEffect(() => {
    if (planId && basePlan) {
      setFormData(prev => ({ ...prev, basePlanId: planId }))
      toast.success(`Plano "${basePlan.unidadeCurricular}" carregado como base`)
    }
  }, [planId, basePlan])

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
      const basePlanParam = formData.basePlanId ? `&basePlanId=${formData.basePlanId}` : ''
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/teaching-plans/generate/${formData.diaryId}?token=${token}${basePlanParam}`
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
            setGenerationMessage('Salvando plano de ensino...')
            eventSource.close()

            // Save the plan and redirect to review page
            savePlan(
              {
                diaryId: formData.diaryId,
                generatedPlan: data.plan,
                basePlanId: formData.basePlanId || undefined,
              },
              {
                onSuccess: (response) => {
                  toast.success('Plano gerado e salvo com sucesso!')
                  // Redirect to review page
                  router.push(`/plans/review/${response.plan.id}`)
                },
                onError: () => {
                  toast.error('Plano gerado mas erro ao salvar')
                  setStep("config")
                },
              }
            )
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


                <CardContent className="space-y-6">



                  {/* Base Plan Details */}
                  {basePlan && (
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="bg-green-50/50 dark:bg-green-950/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              Plano Base Carregado
                            </CardTitle>
                            <CardDescription>
                              A IA usará este plano como referência para gerar uma nova versão
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Identification */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3">Identificação</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Campus:</span>
                                <p className="font-medium">{basePlan.campus || 'Não informado'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ano/Semestre:</span>
                                <p className="font-medium">{basePlan.anoSemestre || 'Não informado'}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Curso:</span>
                                <p className="font-medium">{basePlan.curso || 'Não informado'}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Unidade Curricular:</span>
                                <p className="font-medium">{basePlan.unidadeCurricular || 'Não informado'}</p>
                              </div>
                              {basePlan.professores && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Professor(es):</span>
                                  <p className="font-medium">{basePlan.professores}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Workload */}
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3">Carga Horária</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total:</span>
                                <p className="font-medium">
                                  {basePlan.cargaHorariaTotal ? `${basePlan.cargaHorariaTotal}h` : 'Não informado'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Quantidade de Aulas:</span>
                                <p className="font-medium">
                                  {basePlan.propostaTrabalho && basePlan.propostaTrabalho.length > 0
                                    ? `${basePlan.propostaTrabalho.reduce((sum: number, item: any) => sum + parseInt(item.numAulas || '0'), 0)} aulas`
                                    : (basePlan.numAulasTeorica || 0) + (basePlan.numAulasPraticas || 0) > 0
                                      ? `${(basePlan.numAulasTeorica || 0) + (basePlan.numAulasPraticas || 0)} aulas`
                                      : 'Não informado'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Aulas Teóricas:</span>
                                <p className="font-medium">
                                  {basePlan.numAulasTeorica ? `${basePlan.numAulasTeorica}` : 'Não informado'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Aulas Práticas:</span>
                                <p className="font-medium">
                                  {basePlan.numAulasPraticas ? `${basePlan.numAulasPraticas}` : 'Não informado'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Plan Info */}
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3">Informações do Plano</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <p className="font-medium">{basePlan.status || 'Não informado'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Origem:</span>
                                <p className="font-medium">
                                  {basePlan.source === 'ifms' ? 'Sistema IFMS' : 'Gerado por IA'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Ementa Preview */}
                          {basePlan.ementa && (
                            <div className="pt-4 border-t">
                              <h4 className="text-sm font-semibold mb-2">Ementa</h4>
                              <div className="bg-muted/50 p-3 rounded-md">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {basePlan.ementa}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Info: Objectives will be generated */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Objetivos Gerados Automaticamente
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          A IA irá gerar os objetivos de aprendizagem (geral e específicos)
                          automaticamente com base na ementa e nas diretrizes do MEC.
                          Isso garante alinhamento pedagógico adequado.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Methodology */}
                  <div className="space-y-2">
                    <Label htmlFor="methodology">Metodologia Preferida (Opcional)</Label>
                    <Select
                      value={formData.methodology}
                      onValueChange={(value) => setFormData({ ...formData, methodology: value })}
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
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
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
              {/* Main Card */}
              <Card className="w-full max-w-3xl border-primary/50 shadow-xl">
                <CardContent className="pt-12 pb-12">
                  <div className="flex flex-col items-center text-center space-y-8">
                    {/* Animated Icon */}
                    <div className="relative">
                      {/* Outer ping */}
                      <div className="absolute inset-0 animate-ping opacity-75">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-lg"></div>
                      </div>
                      {/* Main gradient circle */}
                      <div className="relative h-24 w-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                        <Sparkles className="h-12 w-12 text-white animate-pulse" />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Gerando Plano de Ensino
                      </h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Nossa IA está analisando o conteúdo e criando um plano pedagógico personalizado
                      </p>
                    </div>

                    {/* Progress Bar with Shimmer */}
                    <div className="w-full max-w-lg space-y-3">
                      <div className="relative">
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden bg-[length:200%_100%] animate-gradient"
                            style={{ width: `${generationProgress}%` }}
                          >
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">{generationProgress}% concluído</span>
                        <span className="font-semibold text-primary">
                          {generationProgress === 100 ? '✓ Finalizando...' : '⚡ Processando...'}
                        </span>
                      </div>
                    </div>

                    {/* Current Step Card */}
                    <div className="w-full max-w-lg">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">
                              {generationMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Steps Indicator */}
                    <div className="w-full max-w-lg pt-4">
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { label: 'Carregar', threshold: 10 },
                          { label: 'Analisar', threshold: 30 },
                          { label: 'Gerar IA', threshold: 60 },
                          { label: 'Processar', threshold: 90 },
                          { label: 'Salvar', threshold: 100 }
                        ].map((stepItem, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <div className={`h-2 w-full rounded-full transition-all duration-300 ${generationProgress >= stepItem.threshold
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-md'
                                : 'bg-muted'
                              }`}></div>
                            <span className={`text-xs transition-all duration-300 ${generationProgress >= stepItem.threshold
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground'
                              }`}>
                              {stepItem.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Tip */}
              <Card className="mt-4 w-full max-w-3xl border-muted/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3 text-sm">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Aguarde:</strong> O plano será salvo automaticamente e você poderá editá-lo antes de enviar ao sistema IFMS.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
      <GeneratePageContent />
    </Suspense>
  )
}
