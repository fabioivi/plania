'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, Edit, FileText, Loader2, Printer, RefreshCw, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { api, TeachingPlan } from "@/services/api"
import { toast } from "sonner"
import { TeachingPlanView } from "@/components/teaching-plan/TeachingPlanView"

export default function TeachingPlanViewPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string
  
  const [plan, setPlan] = useState<TeachingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

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

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.post(`/academic/teaching-plans/${planId}/sync`)
      toast.success('Plano de ensino sincronizado com sucesso!')
      
      // Recarrega o plano
      setLoading(true)
      await loadPlan()
      setLoading(false)
    } catch (error: any) {
      console.error('Erro ao sincronizar plano:', error)
      toast.error(error.response?.data?.message || 'Erro ao sincronizar plano de ensino')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateDiaryContent = () => {
    // Se o plano tem diário vinculado
    if (plan?.diaryId) {
      router.push(`/diaries/${plan.diaryId}/generate?planId=${planId}`)
    } else {
      toast.error('Este plano de ensino não possui diário vinculado')
    }
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
              <Button variant="ghost" className="gap-2 mb-4 print:hidden">
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
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
                <Button 
                  variant="default" 
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                  onClick={handleGenerateDiaryContent}
                  disabled={!plan.diaryId}
                  title={!plan.diaryId ? 'Nenhum diário vinculado' : 'Gerar conteúdo do diário a partir deste plano'}
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar Conteúdo do Diário
                </Button>
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

          {/* Teaching Plan View Component */}
          <TeachingPlanView plan={plan} variant="full" showHeader={true} />

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
