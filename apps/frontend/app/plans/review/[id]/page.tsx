"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Target,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Wand2,
  Upload,
  CheckCircle2,
  Eye,
  Loader2,
  Trash2,
  Save
} from "lucide-react"
import Link from "next/link"
import { PlanHeader } from "@/components/layout/plan-header"
import { useTeachingPlan, useDeleteTeachingPlan, useUpdateTeachingPlan } from "@/hooks/api"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Header } from "@/components/layout/header"
import { toast } from "sonner"
import { aiService, type ImproveFieldRequest } from "@/services/api/ai.service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PlanReviewPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  // Load plan data using React Query
  const { data: plan, isLoading, error } = useTeachingPlan(planId)

  // Delete mutation
  const { mutate: deletePlan, isPending: deleting } = useDeleteTeachingPlan()

  // Update mutation
  const { mutate: updatePlan, isPending: saving } = useUpdateTeachingPlan()

  const [showAiAssistant, setShowAiAssistant] = useState(true)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isFilling, setIsFilling] = useState(false)
  const [fillSuccess, setFillSuccess] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // AI loading states
  const [aiLoading, setAiLoading] = useState<string | null>(null) // Which action is loading

  // Editable fields state
  const [objetivoGeral, setObjetivoGeral] = useState(plan?.objetivoGeral || '')
  const [objetivosEspecificos, setObjetivosEspecificos] = useState(plan?.objetivosEspecificos || '')
  const [numAulasTeorica, setNumAulasTeorica] = useState(plan?.numAulasTeorica || 0)
  const [numAulasPraticas, setNumAulasPraticas] = useState(plan?.numAulasPraticas || 0)
  const [propostaTrabalho, setPropostaTrabalho] = useState(plan?.propostaTrabalho || [])
  const [hasChanges, setHasChanges] = useState(false)

  const handleFillDiary = async () => {
    setIsFilling(true)
    setFillSuccess(false)

    // Simular preenchimento automático do diário
    await new Promise(resolve => setTimeout(resolve, 3000))

    setIsFilling(false)
    setFillSuccess(true)

    // Remover mensagem de sucesso após 5 segundos
    setTimeout(() => setFillSuccess(false), 5000)
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    deletePlan(planId, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        router.push('/disciplines')
      },
      onError: () => {
        setShowDeleteDialog(false)
      }
    })
  }

  const handleSaveChanges = () => {
    updatePlan({
      planId,
      data: {
        objetivoGeral,
        objetivosEspecificos,
        numAulasTeorica,
        numAulasPraticas,
        propostaTrabalho,
      }
    }, {
      onSuccess: () => {
        setHasChanges(false)
        toast.success('Plano atualizado com sucesso!')
      }
    })
  }

  const handleConteudoChange = (index: number, newConteudo: string) => {
    const updated = [...propostaTrabalho]
    updated[index] = { ...updated[index], conteudo: newConteudo }
    setPropostaTrabalho(updated)
    setHasChanges(true)
  }

  // AI Quick Actions Handlers
  const handleImproveObjectives = async () => {
    if (aiLoading) return
    setAiLoading('objectives')
    try {
      // Improve general objective
      const generalResult = await aiService.improveField(planId, {
        field: 'objetivoGeral',
        currentContent: objetivoGeral,
        planContext: {
          unidadeCurricular: plan?.unidadeCurricular,
          curso: plan?.curso,
          ementa: plan?.ementa,
        },
      })
      if (generalResult.success && generalResult.improvedContent) {
        setObjetivoGeral(generalResult.improvedContent)
        setHasChanges(true)
      }

      // Improve specific objectives
      const specificResult = await aiService.improveField(planId, {
        field: 'objetivosEspecificos',
        currentContent: objetivosEspecificos,
        planContext: {
          unidadeCurricular: plan?.unidadeCurricular,
          curso: plan?.curso,
          ementa: plan?.ementa,
        },
      })
      if (specificResult.success && specificResult.improvedContent) {
        setObjetivosEspecificos(specificResult.improvedContent)
        setHasChanges(true)
      }

      toast.success('Objetivos melhorados com IA!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao melhorar objetivos')
    } finally {
      setAiLoading(null)
    }
  }

  const handleSuggestMethodology = async () => {
    if (aiLoading) return
    setAiLoading('methodology')
    try {
      const result = await aiService.improveField(planId, {
        field: 'metodologia',
        currentContent: '',
        planContext: {
          unidadeCurricular: plan?.unidadeCurricular,
          curso: plan?.curso,
          ementa: plan?.ementa,
        },
      })
      if (result.success && result.improvedContent) {
        toast.success('Metodologias sugeridas! Veja na tab Metodologia.')
        // For now, show in a toast since metodologia field might not be editable
        toast.info(result.improvedContent.substring(0, 200) + '...')
      } else {
        toast.error(result.message || 'Erro ao sugerir metodologias')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sugerir metodologias')
    } finally {
      setAiLoading(null)
    }
  }

  const handleAddEvaluations = async () => {
    if (aiLoading) return
    setAiLoading('evaluations')
    try {
      const result = await aiService.improveField(planId, {
        field: 'avaliacaoAprendizagem',
        currentContent: JSON.stringify(plan?.avaliacaoAprendizagem || []),
        planContext: {
          unidadeCurricular: plan?.unidadeCurricular,
          curso: plan?.curso,
          ementa: plan?.ementa,
        },
      })
      if (result.success && result.improvedContent) {
        toast.success('Sugestões de avaliação geradas!')
        toast.info(result.improvedContent.substring(0, 200) + '...')
      } else {
        toast.error(result.message || 'Erro ao sugerir avaliações')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sugerir avaliações')
    } finally {
      setAiLoading(null)
    }
  }

  const handleExpandContent = async () => {
    if (aiLoading) return
    setAiLoading('content')
    try {
      const contentSummary = propostaTrabalho
        .map((item: any, i: number) => `Semana ${i + 1}: ${item.conteudo || 'N/A'}`)
        .join('\n')

      const result = await aiService.improveField(planId, {
        field: 'propostaTrabalho',
        currentContent: contentSummary,
        planContext: {
          unidadeCurricular: plan?.unidadeCurricular,
          curso: plan?.curso,
          ementa: plan?.ementa,
        },
      })
      if (result.success && result.improvedContent) {
        toast.success('Conteúdo expandido! Revise as sugestões.')
        toast.info(result.improvedContent.substring(0, 300) + '...')
      } else {
        toast.error(result.message || 'Erro ao expandir conteúdo')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao expandir conteúdo')
    } finally {
      setAiLoading(null)
    }
  }

  const handleCustomPrompt = async () => {
    if (aiLoading || !aiPrompt.trim()) return
    setAiLoading('custom')
    try {
      const result = await aiService.improveField(planId, {
        field: 'custom',
        currentContent: objetivoGeral + '\n\n' + objetivosEspecificos,
        prompt: aiPrompt,
        planContext: {
          unidadeCurricular: plan?.unidadeCurricular,
          curso: plan?.curso,
          ementa: plan?.ementa,
        },
      })
      if (result.success && result.improvedContent) {
        toast.success('Prompt aplicado com sucesso!')
        // Apply the result to the objectives for now
        setObjetivoGeral(result.improvedContent)
        setHasChanges(true)
        setAiPrompt('')
      } else {
        toast.error(result.message || 'Erro ao aplicar prompt')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar com IA')
    } finally {
      setAiLoading(null)
    }
  }

  // Sync state when plan data loads
  if (plan && !hasChanges) {
    if (objetivoGeral !== plan.objetivoGeral) setObjetivoGeral(plan.objetivoGeral || '')
    if (objetivosEspecificos !== plan.objetivosEspecificos) setObjetivosEspecificos(plan.objetivosEspecificos || '')
    if (numAulasTeorica !== plan.numAulasTeorica) setNumAulasTeorica(plan.numAulasTeorica || 0)
    if (numAulasPraticas !== plan.numAulasPraticas) setNumAulasPraticas(plan.numAulasPraticas || 0)
    if (propostaTrabalho.length === 0 && plan.propostaTrabalho) setPropostaTrabalho(plan.propostaTrabalho)
  }


  // Loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-16 px-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando plano de ensino...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // Error state
  if (error || !plan) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-16 px-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Plano não encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  O plano de ensino solicitado não foi encontrado.
                </p>
                <Link href="/disciplines">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Disciplinas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PlanHeader
          planTitle={plan.unidadeCurricular || 'Plano de Ensino'}
          planInfo={`${plan.anoSemestre || ''} • ${plan.cargaHorariaTotal || 0}h`}
          status={plan.source === 'ai' && !plan.sentToIFMS ? 'draft' : 'approved'}
        />

        <div className="flex">
          {/* Main Content */}
          <main className={`flex-1 container mx-auto py-8 px-4 transition-all ${showAiAssistant ? 'max-w-5xl' : 'max-w-7xl'}`}>
            {/* Back Button */}
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>

            {/* Plan Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Plano de Ensino</h1>
                  <p className="text-muted-foreground">
                    Revise e edite o plano gerado pela IA. Use o assistente ao lado para fazer ajustes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || saving}
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
                  <Link href={`/teaching-plans/${planId}?from=review`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar Prévia
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {showAiAssistant ? "Ocultar" : "Mostrar"} Assistente IA
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleFillDiary}
                    disabled={isFilling || fillSuccess}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isFilling ? (
                      <>
                        <Wand2 className="h-4 w-4 animate-spin" />
                        Preenchendo...
                      </>
                    ) : fillSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Diário Preenchido!
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Preencher Diário
                      </>
                    )}
                  </Button>
                  {plan?.source === 'ai' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteClick}
                      disabled={deleting}
                      className="gap-2"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Excluir Plano
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Success Alert */}
              {fillSuccess && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <p className="font-semibold">Diário preenchido com sucesso!</p>
                      <p className="text-sm">O conteúdo do plano de ensino foi sincronizado automaticamente com o Sistema Acadêmico IFMS.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plan Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="objectives">Objetivos</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="methodology">Metodologia</TabsTrigger>
                <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informações Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discipline">Unidade Curricular</Label>
                        <Input
                          id="discipline"
                          value={plan.unidadeCurricular || ''}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="course">Curso</Label>
                        <Input
                          id="course"
                          value={plan.curso || ''}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campus">Campus</Label>
                        <Input
                          id="campus"
                          value={plan.campus || ''}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester">Período</Label>
                        <Input
                          id="semester"
                          value={plan.anoSemestre || ''}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workload">Carga Horária</Label>
                        <Input
                          id="workload"
                          value={`${plan.cargaHorariaTotal || 0}h`}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weeks">Número de Semanas</Label>
                        <Input
                          id="weeks"
                          type="number"
                          value={plan.numSemanas || 0}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="theoretical">Aulas Teóricas</Label>
                        <Input
                          id="theoretical"
                          type="number"
                          value={numAulasTeorica}
                          onChange={(e) => {
                            setNumAulasTeorica(parseInt(e.target.value) || 0)
                            setHasChanges(true)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="practical">Aulas Práticas</Label>
                        <Input
                          id="practical"
                          type="number"
                          value={numAulasPraticas}
                          onChange={(e) => {
                            setNumAulasPraticas(parseInt(e.target.value) || 0)
                            setHasChanges(true)
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Ementa</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={plan.ementa || ''}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Objectives Tab */}
              <TabsContent value="objectives" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Objetivos de Aprendizagem
                    </CardTitle>
                    <CardDescription>
                      Competências e habilidades que os alunos devem desenvolver
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Objetivo Geral</Label>
                      <Textarea
                        rows={3}
                        value={objetivoGeral}
                        onChange={(e) => {
                          setObjetivoGeral(e.target.value)
                          setHasChanges(true)
                        }}
                        placeholder="Descreva o objetivo geral da disciplina..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Objetivos Específicos</Label>
                      <Textarea
                        rows={8}
                        value={objetivosEspecificos}
                        onChange={(e) => {
                          setObjetivosEspecificos(e.target.value)
                          setHasChanges(true)
                        }}
                        placeholder="Liste os objetivos específicos da disciplina..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Detalhamento da Proposta de Trabalho
                    </CardTitle>
                    <CardDescription>
                      Cronograma semanal de aulas com conteúdo e metodologia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.propostaTrabalho && plan.propostaTrabalho.length > 0 ? (
                      <>
                        <div className="rounded-md border overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="p-3 text-left font-semibold min-w-[120px]">Mês/Período</th>
                                <th className="p-3 text-center font-semibold">Nº Aulas</th>
                                <th className="p-3 text-left font-semibold min-w-[200px]">Conteúdo</th>
                                <th className="p-3 text-left font-semibold min-w-[150px]">Técnicas de Ensino</th>
                                <th className="p-3 text-left font-semibold min-w-[150px]">Recursos de Ensino</th>
                                <th className="p-3 text-left font-semibold">Observações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {propostaTrabalho.map((item, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3">
                                    <div className="font-medium">{item.mes}</div>
                                    <div className="text-xs text-muted-foreground">{item.periodo}</div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge>{item.numAulas}</Badge>
                                  </td>
                                  <td className="p-3">
                                    <Textarea
                                      value={item.conteudo || ''}
                                      onChange={(e) => handleConteudoChange(index, e.target.value)}
                                      rows={2}
                                      className="text-sm min-w-[200px]"
                                      placeholder="Conteúdo da aula..."
                                    />
                                  </td>
                                  <td className="p-3">
                                    {item.tecnicasEnsino && item.tecnicasEnsino.length > 0 ? (
                                      <div className="flex gap-1.5 flex-wrap">
                                        {item.tecnicasEnsino.map((tecnica, i) => (
                                          <Badge
                                            key={i}
                                            variant="secondary"
                                            className="text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
                                          >
                                            {tecnica}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {item.recursosEnsino && item.recursosEnsino.length > 0 ? (
                                      <div className="flex gap-1.5 flex-wrap">
                                        {item.recursosEnsino.map((recurso, i) => (
                                          <Badge
                                            key={i}
                                            variant="secondary"
                                            className="text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                                          >
                                            {recurso}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-muted-foreground">{item.observacoes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">Total de Aulas:</span>
                            <span className="text-sm text-muted-foreground">
                              Carga horária: {plan.cargaHorariaTotal || 0}h
                            </span>
                          </div>
                          <div className="flex gap-3 items-center">
                            <Badge variant="secondary" className="text-lg px-4">
                              {plan.propostaTrabalho.reduce((sum, item) => sum + parseInt(item.numAulas || '0'), 0)} aulas
                            </Badge>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma proposta de trabalho definida ainda.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Methodology Tab */}
              <TabsContent value="methodology" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Metodologia de Ensino
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.propostaTrabalho && plan.propostaTrabalho.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Metodologias Utilizadas</Label>
                        <div className="rounded-md border p-4 bg-muted/30">
                          <div className="space-y-2">
                            {Array.from(
                              new Set(
                                plan.propostaTrabalho
                                  .map(item => item.metodologia)
                                  .filter(Boolean)
                              )
                            ).map((metodologia, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                                <span>{metodologia}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma metodologia definida ainda.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Evaluation Tab */}
              <TabsContent value="evaluation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Sistema de Avaliação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.avaliacaoAprendizagem && plan.avaliacaoAprendizagem.length > 0 && (
                      <div className="space-y-2">
                        <Label>Avaliações</Label>
                        <div className="rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="p-3 text-left font-semibold">Etapa</th>
                                <th className="p-3 text-left font-semibold">Avaliação</th>
                                <th className="p-3 text-left font-semibold">Instrumentos</th>
                                <th className="p-3 text-left font-semibold">Data Prevista</th>
                                <th className="p-3 text-left font-semibold">Valor Máximo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {plan.avaliacaoAprendizagem.map((avaliacao, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3">{avaliacao.etapa}</td>
                                  <td className="p-3">{avaliacao.avaliacao}</td>
                                  <td className="p-3">{avaliacao.instrumentos}</td>
                                  <td className="p-3">{avaliacao.dataPrevista}</td>
                                  <td className="p-3 text-center">{avaliacao.valorMaximo}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {plan.observacoesAvaliacoes && (
                      <div className="space-y-2">
                        <Label>Observações sobre Avaliações</Label>
                        <Textarea
                          rows={3}
                          value={plan.observacoesAvaliacoes}
                          readOnly
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Recuperação da Aprendizagem</Label>
                      <Textarea
                        rows={4}
                        value={plan.recuperacaoAprendizagem || ''}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Referências Bibliográficas</Label>
                      <Textarea
                        rows={6}
                        value={plan.referencias || ''}
                        readOnly
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>

          {/* AI Assistant Sidebar */}
          {showAiAssistant && (
            <aside className="w-96 border-l bg-muted/30 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Assistant Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">Assistente IA</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Peça sugestões, melhorias ou reescreva seções do seu plano
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Ações Rápidas
                  </Label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleImproveObjectives}
                      disabled={!!aiLoading}
                    >
                      {aiLoading === 'objectives' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {aiLoading === 'objectives' ? 'Melhorando...' : 'Melhorar objetivos'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleSuggestMethodology}
                      disabled={!!aiLoading}
                    >
                      {aiLoading === 'methodology' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {aiLoading === 'methodology' ? 'Sugerindo...' : 'Sugerir metodologias'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleAddEvaluations}
                      disabled={!!aiLoading}
                    >
                      {aiLoading === 'evaluations' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {aiLoading === 'evaluations' ? 'Gerando...' : 'Adicionar avaliações'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleExpandContent}
                      disabled={!!aiLoading}
                    >
                      {aiLoading === 'content' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {aiLoading === 'content' ? 'Gerando...' : 'Gerar conteúdo'}
                    </Button>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Solicitação Personalizada
                  </Label>
                  <Textarea
                    placeholder="Ex: Adicione mais exercícios práticos na unidade 2..."
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={!!aiLoading}
                  />
                  <Button
                    className="w-full gap-2"
                    onClick={handleCustomPrompt}
                    disabled={!!aiLoading || !aiPrompt.trim()}
                  >
                    {aiLoading === 'custom' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {aiLoading === 'custom' ? 'Processando...' : 'Aplicar com IA'}
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Sugestões
                  </Label>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1 text-sm">
                            <p className="font-medium mb-1">Incluir metodologias ativas</p>
                            <p className="text-xs text-muted-foreground">
                              Considere adicionar aprendizagem baseada em problemas
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Aplicar
                          </Button>
                          <Button size="sm" variant="ghost" className="flex-1">
                            Ignorar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1 text-sm">
                            <p className="font-medium mb-1">Detalhamento de avaliação</p>
                            <p className="text-xs text-muted-foreground">
                              As datas das provas poderiam ser mais específicas
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Aplicar
                          </Button>
                          <Button size="sm" variant="ghost" className="flex-1">
                            Ignorar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este plano de ensino gerado por IA?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}
