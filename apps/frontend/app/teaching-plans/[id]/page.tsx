'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Edit, FileText, Loader2, Calendar, Clock, BookOpen, Target, ClipboardCheck, GraduationCap, BookMarked, Printer } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { api, TeachingPlan } from "@/services/api"
import { toast } from "sonner"

export default function TeachingPlanViewPage() {
  const params = useParams()
  const planId = params.id as string
  
  const [plan, setPlan] = useState<TeachingPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlan()
  }, [planId])

  const loadPlan = async () => {
    try {
      setLoading(true)
      // Fetch plan details - you'll need to create this endpoint or fetch from parent
      const response = await api.get(`/academic/teaching-plans/${planId}`)
      setPlan(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar plano:', err)
      toast.error('Erro ao carregar plano de ensino')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!plan) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-8 px-4 max-w-7xl">
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
        <Header />

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            header {
              display: none !important;
            }
            main {
              padding: 20px !important;
            }
            h1 {
              font-size: 24px !important;
            }
            .break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}</style>

        <main className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <Link href="/disciplines">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Disciplinas
              </Button>
            </Link>
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {plan.unidadeCurricular || 'Plano de Ensino'}
                </h1>
                <p className="text-muted-foreground">
                  {plan.curso} • {plan.campus}
                </p>
              </div>
              
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" className="gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar com IA
                </Button>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p className="font-semibold">{plan.anoSemestre || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Carga Horária</p>
                    <p className="font-semibold">{plan.cargaHorariaTotal || 0}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Aulas</p>
                    <p className="font-semibold">
                      {(plan.numAulasTeorica || 0) + (plan.numAulasPraticas || 0)} aulas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className="mt-1">{plan.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Campus</p>
                    <p className="font-medium">{plan.campus || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ano/Semestre</p>
                    <p className="font-medium">{plan.anoSemestre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Curso</p>
                    <p className="font-medium">{plan.curso || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unidade Curricular</p>
                    <p className="font-medium">{plan.unidadeCurricular || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Professor(es)</p>
                    <p className="font-medium">{plan.professores || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Carga Horária Total</p>
                    <p className="font-medium">{plan.cargaHorariaTotal || 0}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aulas Teóricas</p>
                    <p className="font-medium">{plan.numAulasTeorica || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aulas Práticas</p>
                    <p className="font-medium">{plan.numAulasPraticas || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ementa */}
            {plan.ementa && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Ementa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{plan.ementa}</p>
                </CardContent>
              </Card>
            )}

            {/* Objetivos */}
            {(plan.objetivoGeral || plan.objetivosEspecificos) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objetivos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.objetivoGeral && (
                    <div>
                      <h4 className="font-semibold mb-2">Objetivo Geral</h4>
                      <p className="text-sm whitespace-pre-wrap">{plan.objetivoGeral}</p>
                    </div>
                  )}
                  {plan.objetivosEspecificos && (
                    <div>
                      <h4 className="font-semibold mb-2">Objetivos Específicos</h4>
                      <p className="text-sm whitespace-pre-wrap">{plan.objetivosEspecificos}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Avaliação */}
            {plan.avaliacaoAprendizagem && plan.avaliacaoAprendizagem.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Sistema de Avaliação da Aprendizagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Etapa</th>
                          <th className="text-left py-2 px-3">Avaliação</th>
                          <th className="text-left py-2 px-3">Instrumentos</th>
                          <th className="text-left py-2 px-3">Data Prevista</th>
                          <th className="text-left py-2 px-3">Valor Máximo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.avaliacaoAprendizagem.map((avaliacao: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-3">{avaliacao.etapa}</td>
                            <td className="py-2 px-3">{avaliacao.avaliacao}</td>
                            <td className="py-2 px-3">{avaliacao.instrumentos}</td>
                            <td className="py-2 px-3">{avaliacao.dataPrevista}</td>
                            <td className="py-2 px-3">{avaliacao.valorMaximo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {plan.observacoesAvaliacoes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-xs font-semibold mb-1">Observações:</p>
                      <p className="text-sm whitespace-pre-wrap">{plan.observacoesAvaliacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recuperação */}
            {plan.recuperacaoAprendizagem && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Estratégias de Recuperação da Aprendizagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{plan.recuperacaoAprendizagem}</p>
                </CardContent>
              </Card>
            )}

            {/* Cronograma */}
            {plan.propostaTrabalho && plan.propostaTrabalho.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Proposta de Trabalho (Cronograma)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.propostaTrabalho.map((item: any, index: number) => (
                      <div key={index} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{item.mes}</h4>
                            <p className="text-xs text-muted-foreground">
                              Período: {item.periodo} • {item.numAulas} aula(s)
                            </p>
                          </div>
                        </div>
                        {item.conteudo && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground">Conteúdo:</p>
                            <p className="text-sm">{item.conteudo}</p>
                          </div>
                        )}
                        {item.metodologia && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground">Metodologia:</p>
                            <p className="text-sm">{item.metodologia}</p>
                          </div>
                        )}
                        {item.observacoes && (
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs font-semibold text-muted-foreground">Observações:</p>
                            <p className="text-sm">{item.observacoes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referências */}
            {plan.referencias && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5" />
                    Referências Bibliográficas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{plan.referencias}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex justify-between items-center print:hidden">
            <Link href="/disciplines">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Editar com IA
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
