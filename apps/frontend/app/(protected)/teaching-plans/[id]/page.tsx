'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Loader2, RefreshCw, Sparkles, Trash2, Printer, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

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
  }

  const handleGenerateDiaryContent = () => {
    if (plan?.diaryId) {
      router.push(`/diaries/${plan.diaryId}/generate?planId=${planId}`)
    } else {
      toast.error('Este plano de ensino não possui diário vinculado')
    }
  }

  const handleEditWithAI = () => {
    if (plan?.diaryId) {
      router.push(`/generate?diaryId=${plan.diaryId}&planId=${planId}`)
    } else {
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

  // Loading State
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium animate-pulse">Carregando plano de ensino...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Not Found State
  if (!plan) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 dark:bg-background p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-white dark:bg-card p-4 rounded-full inline-block shadow-sm mb-4">
              <FileText className="h-12 w-12 text-slate-300 dark:text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-foreground mb-2">Plano não encontrado</h3>
            <p className="text-slate-500 dark:text-muted-foreground mb-8">
              O documento que você está procurando não existe ou foi removido.
            </p>
            <Link href="/disciplines">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Disciplinas
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-background pb-20">

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              background: white !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            header, aside {
              display: none !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
            }
            .break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}</style>

        <div className="w-full">
          {/* Header Action Bar */}
          <div className="mb-8 print:hidden">
            <Link href={fromReview ? `/plans/review/${planId}` : "/disciplines"} className="inline-block mb-6">
              <Button variant="ghost" className="pl-0 gap-2 text-slate-500 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-transparent group">
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-full p-1 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="font-semibold">{fromReview ? "Voltar para Edição" : "Voltar para Disciplinas"}</span>
              </Button>
            </Link>

            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 bg-white dark:bg-card p-6 rounded-[2rem] border border-slate-200 dark:border-border shadow-sm dark:shadow-none relative overflow-hidden">
              {/* Decorative background blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 max-w-2xl">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-foreground mb-2 leading-tight">
                  {plan.unidadeCurricular || 'Plano de Ensino'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-muted-foreground font-medium">
                  <span className="bg-slate-100 dark:bg-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{plan.campus}</span>
                  <span>•</span>
                  <span>{plan.curso}</span>
                </div>
              </div>

              <div className="relative z-10 flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                <Button
                  variant="outline"
                  className="gap-2 border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold rounded-xl"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Atualizar'}
                </Button>

                <Button variant="outline" className="gap-2 border-slate-200 dark:border-border text-slate-700 dark:text-foreground font-semibold rounded-xl" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>

                <Button
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                  onClick={handleEditWithAI}
                  disabled={!plan.diaryId}
                >
                  <Sparkles className="h-4 w-4" />
                  Editar IA
                </Button>

                {/* CTA for generating diary content - moved here */}
                {plan.diaryId && (
                  <Button
                    onClick={handleGenerateDiaryContent}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none"
                  >
                    <FileText className="h-4 w-4" />
                    Gerar Aulas
                  </Button>
                )}

                {plan?.source === 'ai' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    onClick={handleDeleteClick}
                    disabled={deleting}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Teaching Plan View Component */}
          <TeachingPlanView plan={plan} variant="full" showHeader={true} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá permanentemente este plano de ensino gerado pela IA.
              Se você vinculou este plano a um diário, o vínculo será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
            >
              {deleting ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
