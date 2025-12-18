"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, ArrowRight, Loader2, CheckCircle2, ChevronLeft, BrainCircuit, Wand2 } from "lucide-react"
import Link from "next/link"

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
        `${process.env.NEXT_PUBLIC_API_URL}/ai/teaching-plans/generate/${formData.diaryId}?token=${token}${basePlanParam}`
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
      <div className="min-h-screen bg-slate-50 relative pb-20">

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />

        <div className="max-w-2xl mx-auto relative z-10 animate-fade-in">

          {/* Navigation */}
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" className="pl-0 gap-2 text-slate-500 hover:text-indigo-600 hover:bg-transparent group">
                <div className="bg-white border border-slate-200 rounded-full p-1 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="font-semibold">Voltar ao Dashboard</span>
              </Button>
            </Link>
          </div>

          {/* Configuration Step */}
          {step === "config" && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm inline-flex mb-2 ring-1 ring-slate-100">
                  <BrainCircuit className="h-8 w-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Gerar Plano de Ensino</h1>
                <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                  Configure os parâmetros e deixe nossa IA criar um plano pedagógico completo e alinhado ao MEC para você.
                </p>
              </div>

              <Card className="border-0 shadow-xl shadow-indigo-100/50 ring-1 ring-slate-100 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-8 space-y-8">

                  {/* Base Plan Information */}
                  {basePlan && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 transition-all hover:bg-emerald-50">
                      <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 p-2 rounded-xl shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-emerald-900">Usando Plano Base</h3>
                          <p className="text-sm text-emerald-700 leading-relaxed">
                            A IA usará <strong>{basePlan.unidadeCurricular}</strong> como referência estrutural para gerar a nova versão.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI capabilities info */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-100 p-2 rounded-xl shrink-0">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-indigo-900">Geração Inteligente</h3>
                        <p className="text-sm text-indigo-700 leading-relaxed">
                          Objetivos, conteúdo programático e cronograma serão gerados automaticamente com base na ementa da disciplina.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Methodology */}
                    <div className="space-y-3">
                      <Label htmlFor="methodology" className="text-base font-bold text-slate-700">Metodologia Preferida</Label>
                      <Select
                        value={formData.methodology}
                        onValueChange={(value) => setFormData({ ...formData, methodology: value })}
                      >
                        <SelectTrigger id="methodology" className="h-12 border-slate-200 bg-slate-50/50 focus:ring-indigo-500 rounded-xl">
                          <SelectValue placeholder="Deixar a IA sugerir a melhor metodologia" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="tradicional">Aulas Expositivas Tradicionais</SelectItem>
                          <SelectItem value="ativa">Metodologias Ativas</SelectItem>
                          <SelectItem value="hibrida">Híbrida (Presencial + EAD)</SelectItem>
                          <SelectItem value="projetos">Aprendizagem Baseada em Projetos</SelectItem>
                          <SelectItem value="problemas">Aprendizagem Baseada em Problemas</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-400 px-1">Opcional. Se vazio, a IA escolherá com base na natureza da disciplina.</p>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-base font-bold text-slate-700">Observações Adicionais</Label>
                      <Textarea
                        id="notes"
                        placeholder="Ex: Gostaria de focar em aplicações práticas para o mercado de trabalho, incluir 3 aulas de laboratório..."
                        rows={4}
                        className="resize-none border-slate-200 bg-slate-50/50 focus:ring-indigo-500 rounded-xl p-4 text-slate-600 placeholder:text-slate-400"
                        value={formData.additionalNotes}
                        onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={!formData.diaryId}
                      className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Wand2 className="h-5 w-5 mr-2" />
                      Gerar Plano Mágico
                      <ArrowRight className="h-5 w-5 ml-2 opacity-50" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Generating Step */}
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700 slide-in-from-bottom-10">
              {/* Main Card */}
              <Card className="w-full border-0 shadow-2xl shadow-indigo-500/20 bg-white/90 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient" style={{ backgroundSize: '200% auto' }}></div>

                <CardContent className="pt-16 pb-16 px-8">
                  <div className="flex flex-col items-center text-center space-y-10">

                    {/* Central Animation */}
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping opacity-20">
                        <div className="h-32 w-32 rounded-full bg-indigo-500 blur-xl"></div>
                      </div>
                      <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner ring-4 ring-white">
                        <Sparkles className="h-14 w-14 text-white animate-pulse" />
                      </div>
                      {/* Floating particles (simulated) */}
                      <div className="absolute -top-4 -right-4 bg-yellow-400 h-3 w-3 rounded-full animate-bounce delay-100"></div>
                      <div className="absolute -bottom-2 -left-4 bg-purple-400 h-2 w-2 rounded-full animate-bounce delay-200"></div>
                    </div>

                    {/* Status Text */}
                    <div className="space-y-3 max-w-md">
                      <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Criando seu Plano
                      </h2>
                      <p className="text-slate-500 font-medium">
                        Estamos analisando a ementa e estruturando as aulas com base nas melhores práticas pedagógicas.
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-sm space-y-4">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-bold text-indigo-600 uppercase tracking-wider text-xs">Progresso</span>
                        <span className="font-bold text-slate-700">{generationProgress}%</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 ring-1 ring-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out shadow-sm"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Real-time Status */}
                    <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-full flex items-center gap-3 animate-pulse">
                      <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                      <p className="text-sm font-semibold text-slate-600">{generationMessage}</p>
                    </div>

                  </div>
                </CardContent>
              </Card>

              <p className="mt-8 text-center text-slate-400 text-sm max-w-md">
                Isso pode levar alguns segundos. Não feche esta página enquanto a mágica acontece.
              </p>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>}>
      <GeneratePageContent />
    </Suspense>
  )
}
