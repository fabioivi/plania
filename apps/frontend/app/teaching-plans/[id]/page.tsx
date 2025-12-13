'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, FileText, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { TeachingPlanView } from "@/components/teaching-plan/TeachingPlanView"
import { useTeachingPlan, useSyncTeachingPlan, useDeleteTeachingPlan } from "@/hooks/api"
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

export default function TeachingPlanViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = params.id as string
  const fromReview = searchParams.get('from') === 'review'

  // React Query hooks
  const { data: plan, isLoading: loading } = useTeachingPlan(planId)
  const { mutate: syncPlan, isPending: syncing } = useSyncTeachingPlan()
  const { mutate: deletePlan, isPending: deleting } = useDeleteTeachingPlan()

  // Local state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSync = () => {
    syncPlan(planId)
    // Toast and refetch are handled by the mutation
  }

  const handleGenerateDiaryContent = () => {
    // Se o plano tem diário vinculado
    if (plan?.diaryId) {
      router.push(`/diaries/${plan.diaryId}/generate?planId=${planId}`)
    } else {
      toast.error('Este plano de ensino não possui diário vinculado')
    }
  }

  const handleEditWithAI = () => {
    console.log('🔍 handleEditWithAI called', { plan, planId })

    // Redireciona para a página de geração com este plano como base
    if (plan?.diaryId) {
      console.log('✅ Redirecionando para /generate', { diaryId: plan.diaryId, planId })
      router.push(`/generate?diaryId=${plan.diaryId}&planId=${planId}`)
    } else {
      console.log('❌ Plano sem diaryId', plan)
      toast.error('Este plano de ensino não possui diário vinculado')
    }
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
            <Link href={fromReview ? `/plans/review/${planId}` : "/disciplines"}>
              <Button variant="ghost" className="gap-2 mb-4 print:hidden">
                <ArrowLeft className="h-4 w-4" />
                {fromReview ? "Voltar para Edição" : "Voltar para Disciplinas"}
              </Button>
            </Link>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">
                  {plan.unidadeCurricular || 'Plano de Ensino'}
                </h1>
                <p className="text-muted-foreground">
                  {plan.curso} • {plan.campus}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 print:hidden w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
                <Button
                  variant="default"
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
                  onClick={handleGenerateDiaryContent}
                  disabled={!plan.diaryId}
                  title={!plan.diaryId ? 'Nenhum diário vinculado' : 'Gerar conteúdo do diário a partir deste plano'}
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar Conteúdo do Diário
                </Button>
                <Button
                  className="gap-2 w-full sm:w-auto"
                  onClick={handleEditWithAI}
                  disabled={!plan.diaryId}
                  title={!plan.diaryId ? 'Nenhum diário vinculado' : 'Criar nova versão deste plano com IA'}
                >
                  <Edit className="h-4 w-4" />
                  Editar com IA
                </Button>
                {plan?.source === 'ai' && (
                  <Button
                    variant="destructive"
                    className="gap-2 w-full sm:w-auto"
                    onClick={handleDeleteClick}
                    disabled={deleting}
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
          </div>

          {/* Teaching Plan View Component */}
          <TeachingPlanView plan={plan} variant="full" showHeader={true} />

          {/* Footer Actions */}
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <Link href={fromReview ? `/plans/review/${planId}` : "/disciplines"} className="w-full md:w-auto">
              <Button variant="outline" className="gap-2 w-full md:w-auto">
                <ArrowLeft className="h-4 w-4" />
                {fromReview ? "Voltar para Edição" : "Voltar"}
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                className="gap-2 w-full sm:w-auto"
                onClick={handleEditWithAI}
                disabled={!plan.diaryId}
                title={!plan.diaryId ? 'Nenhum diário vinculado' : 'Criar nova versão deste plano com IA'}
              >
                <Edit className="h-4 w-4" />
                Editar com IA
              </Button>
              {plan?.source === 'ai' && (
                <Button
                  variant="destructive"
                  className="gap-2 w-full sm:w-auto"
                  onClick={handleDeleteClick}
                  disabled={deleting}
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
        </main>
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
    </ProtectedRoute>
  )
}
