'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, RefreshCw, Sparkles, Trash2, Printer, ChevronLeft, Clock, GraduationCap, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { TeachingPlanView } from "@/components/teaching-plan/TeachingPlanView"
import { useTeachingPlan, useSyncTeachingPlan, useDeleteTeachingPlan, useDiary } from "@/hooks/api"
import { TeachingPlanDetailsSkeleton } from "@/components/skeletons/TeachingPlanDetailsSkeleton"
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
  const { data: diary } = useDiary(plan?.diaryId)
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
        <TeachingPlanDetailsSkeleton />
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

        <div className="max-w-7xl mx-auto">
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

            <div className="flex flex-col gap-6 bg-white dark:bg-card p-6 rounded-[2rem] border border-slate-200 dark:border-border shadow-sm dark:shadow-none relative overflow-hidden">
              {/* Decorative background blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 w-full">
                {/* Badges Row (Matches Diary Page) */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {plan.anoSemestre && (
                    <div className="flex items-center text-slate-500 dark:text-muted-foreground bg-slate-50 dark:bg-secondary/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-border text-[10px] font-bold uppercase tracking-widest">
                      {plan.anoSemestre}
                    </div>
                  )}

                  {plan.externalId && diary?.externalId && (
                    <a
                      href={`https://academico.ifms.edu.br/administrativo/professores/diario/${diary.externalId}/plano_ensino/ver/${plan.externalId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link"
                      title="Abrir no Sistema IFMS"
                    >
                      <Badge variant="outline" className="bg-slate-50 dark:bg-secondary text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-border font-mono text-[10px] group-hover/link:bg-blue-50 dark:group-hover/link:bg-blue-900/20 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 group-hover/link:border-blue-200 dark:group-hover/link:border-blue-800 transition-colors cursor-pointer flex items-center gap-1 uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">
                        ID: {plan.externalId}
                        <ExternalLink className="h-3 w-3" />
                      </Badge>
                    </a>
                  )}

                  {diary?.turma && (
                    <div className="flex items-center text-slate-500 dark:text-muted-foreground bg-slate-50 dark:bg-secondary/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-border text-[10px] font-bold uppercase tracking-widest">
                      Turma: {diary.turma}
                    </div>
                  )}

                  <div className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${plan.status === 'Aprovado'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 hover:bg-emerald-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0 hover:bg-amber-200"
                    }`}>
                    {plan.status || 'Em Andamento'}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-foreground leading-tight">
                    {plan.unidadeCurricular || 'Plano de Ensino'}
                  </h1>
                </div>

                {/* Metadata Row (Course, Hours) */}
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-slate-500 dark:text-slate-400">
                  {plan.curso && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <span className="truncate max-w-[200px] md:max-w-md" title={plan.curso}>{plan.curso}</span>
                    </div>
                  )}

                  {(plan.cargaHorariaTotal || 0) > 0 && (
                    <>
                      <div className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-border mx-1"></div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{plan.cargaHorariaTotal}h</span>
                      </div>
                    </>
                  )}

                  {/* Detailed Classes Breakdown */}
                  {((plan.numAulasTeorica || 0) + (plan.numAulasPraticas || 0)) > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span className="text-slate-400 dark:text-muted-foreground">
                        • {(plan.numAulasTeorica || 0) + (plan.numAulasPraticas || 0)} Aulas:
                      </span>

                      {(plan.numAulasTeorica || 0) > 0 && (
                        <span className="bg-slate-50 dark:bg-secondary/50 px-2 py-0.5 rounded border border-slate-100 dark:border-border text-slate-600 dark:text-slate-300">
                          {plan.numAulasTeorica} Teóricas
                        </span>
                      )}

                      {(plan.numAulasPraticas || 0) > 0 && (
                        <span className="bg-slate-50 dark:bg-secondary/50 px-2 py-0.5 rounded border border-slate-100 dark:border-border text-slate-600 dark:text-slate-300">
                          {plan.numAulasPraticas} Práticas
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Aligned Left) */}
              <div className="relative z-10 flex flex-wrap gap-3 w-full justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold rounded-xl h-10"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Atualizar'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-200 dark:border-border text-slate-700 dark:text-foreground font-semibold rounded-xl h-10"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>

                <Button
                  size="sm"
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none h-10"
                  onClick={handleEditWithAI}
                  disabled={!plan.diaryId}
                >
                  <Sparkles className="h-4 w-4" />
                  Editar com IA
                </Button>

                {/* CTA for generating diary content */}
                {plan.diaryId && (
                  <Button
                    size="sm"
                    onClick={handleGenerateDiaryContent}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none h-10"
                  >
                    <FileText className="h-4 w-4" />
                    Gerar Aulas
                  </Button>
                )}

                {plan?.source === 'ai' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 w-10"
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
          <TeachingPlanView plan={plan} showHeader={true} />
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
