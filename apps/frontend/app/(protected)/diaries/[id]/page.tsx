'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  FileText,
  Download,
  ExternalLink,
  Upload,
  ChevronLeft,
  Clock,
  GraduationCap,
} from "lucide-react"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DiaryContentTable } from "@/components/diary/DiaryContentTable"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"
import { useDiary, useDiaryContent, useDiaryContentStats, useSyncSpecificDiary } from "@/hooks/api"
import { toast } from "sonner"
import type { DiaryContent } from "@/types"
import { DiaryDetailsSkeleton } from "@/components/skeletons/DiaryDetailsSkeleton"

export default function DiaryContentPage() {
  const params = useParams()

  const diaryId = params?.id as string

  // React Query hooks
  const { data: rawContent = [], isLoading: loadingContent } = useDiaryContent(diaryId)
  const { data: diaryInfo, isLoading: loadingInfo } = useDiary(diaryId)
  const { data: stats, isLoading: loadingStats } = useDiaryContentStats(diaryId)
  const syncSpecificDiaryMutation = useSyncSpecificDiary()

  const loading = loadingContent || loadingInfo || loadingStats

  // Sistema de sincronização para download
  const { state: downloadState, startSync: startDownload, complete: completeDownload, error: errorDownload, reset: resetDownload } = useSyncState('download')

  // Sistema de sincronização para upload
  const { state: uploadState, startSync: startUpload, complete: completeUpload, error: errorUpload, reset: resetUpload } = useSyncState('upload')

  // Process and sort diary content
  const content = useMemo(() => {
    if (!rawContent || rawContent.length === 0) return []

    // Separar aulas normais e antecipações
    const normalClasses = rawContent.filter(item => !item.isAntecipation)
    const anticipations = rawContent.filter(item => item.isAntecipation)

    // Identificar IDs de aulas que foram antecipadas
    const anticipatedClassIds = new Set(anticipations.map(ant => ant.originalContentId))

    // Criar mapa de aulas canceladas (que foram antecipadas)
    const anticipatedClassMap = new Map(
      normalClasses
        .filter(cls => anticipatedClassIds.has(cls.contentId))
        .map(cls => [cls.contentId, cls])
    )

    // Pegar apenas as aulas regulares (que não foram antecipadas)
    const regularClasses = normalClasses.filter(cls => !anticipatedClassIds.has(cls.contentId))

    // Adicionar as antecipações na lista de aulas regulares
    const allActiveClasses = [...regularClasses, ...anticipations]

    // Ordenar todas as aulas ativas por data e horário
    const sortedClasses = allActiveClasses.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) {
        return dateA - dateB
      }
      return a.timeRange.localeCompare(b.timeRange)
    })

    // Construir resultado final: quando encontrar uma antecipação, inserir a aula cancelada logo abaixo
    const result: DiaryContent[] = []
    sortedClasses.forEach(item => {
      result.push(item)
      // Se for uma antecipação, adicionar a aula cancelada logo após
      if (item.isAntecipation && item.originalContentId) {
        const canceledClass = anticipatedClassMap.get(item.originalContentId)
        if (canceledClass) {
          result.push(canceledClass)
        }
      }
    })

    return result
  }, [rawContent])

  const handleReorder = (reorderedContents: DiaryContent[]) => {
    console.log('Nova ordem dos conteúdos:', reorderedContents.map(c => ({
      id: c.id,
      date: c.date,
      timeRange: c.timeRange,
      content: c.content?.substring(0, 50) + '...'
    })))

    // TODO: Salvar nova ordem no backend usando mutation
    // await academicApi.updateDiaryContentOrder(diaryId, reorderedContents)

    toast.success('Ordem atualizada!')
  }

  const handleSync = async () => {
    startDownload(1, 'Baixando conteúdos do sistema IFMS...')

    try {
      const result = await syncSpecificDiaryMutation.mutateAsync(diaryId)

      completeDownload(`${result.synced} conteúdos atualizados com sucesso!`)

      // Reset após 2 segundos
      setTimeout(() => {
        resetDownload()
      }, 2000)

    } catch (error: any) {
      console.error('Erro ao sincronizar diário:', error)
      errorDownload(error.response?.data?.message || 'Erro ao sincronizar diário', [{
        id: 'ERROR',
        name: 'Erro de sincronização',
        success: false,
        message: error.response?.data?.message || error.message
      }])
    }
  }

  const handleSendToSystem = async () => {
    // Filtrar conteúdos a enviar (sem antecipações)
    const anticipations = content.filter(c => c.isAntecipation)
    const anticipatedIds = new Set(anticipations.map(a => a.originalContentId))
    const contentsToSend = content.filter(c => !anticipatedIds.has(c.contentId))
    const contentIds = contentsToSend.map(c => c.contentId)

    if (contentIds.length === 0) {
      toast.error('Nenhum conteúdo para enviar')
      return
    }

    console.log('🚀 Iniciando envio de', contentIds.length, 'conteúdos')
    startUpload(contentIds.length, 'Conectando ao servidor...')

    try {
      // Conectar ao SSE endpoint
      const token = localStorage.getItem('token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${apiBaseUrl}/academic/diaries/${diaryId}/content/send-bulk-sse?contentIds=${contentIds.join(',')}&token=${token}`
      console.log('📡 Conectando ao SSE:', url)

      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
        console.log('📨 SSE Message:', event.data)
        const data = JSON.parse(event.data)

        if (data.type === 'progress') {
          console.log('📊 Progresso:', data.current, '/', data.total, '-', data.contentId)
          const content = contentsToSend.find(c => c.contentId === data.contentId)
          const contentName = content?.date || data.contentId
          startUpload(contentIds.length, `Enviando ${data.current}/${data.total}: ${contentName}`)
        } else if (data.type === 'complete') {
          console.log('✅ Envio completo:', data)
          eventSource.close()

          const items = data.results.map((r: any) => ({
            id: r.contentId,
            name: contentsToSend.find(c => c.contentId === r.contentId)?.date || r.contentId,
            success: r.success,
            message: r.message,
          }))

          completeUpload(
            data.failed === 0
              ? 'Todos os conteúdos foram enviados com sucesso!'
              : `Concluído: ${data.succeeded} enviados, ${data.failed} falhas`,
            items
          )

          if (data.succeeded > 0) {
            toast.success(`${data.succeeded} conteúdo(s) enviado(s) com sucesso!`)
          }

          if (data.failed > 0) {
            toast.error(`${data.failed} conteúdo(s) falharam`)
          }

          // Reset após 3 segundos
          setTimeout(() => {
            resetUpload()
          }, 3000)
        } else if (data.type === 'error') {
          console.error('❌ Erro SSE:', data)
          eventSource.close()

          errorUpload(
            'Erro ao enviar conteúdos',
            [{
              id: 'ERROR',
              name: 'Erro geral',
              success: false,
              message: data.message || 'Erro desconhecido',
            }]
          )

          toast.error(data.message || 'Erro ao enviar conteúdos')
        }
      }

      eventSource.onerror = (err) => {
        console.error('❌ Erro no SSE:', err)
        eventSource.close()

        errorUpload(
          'Erro ao enviar conteúdos',
          [{
            id: 'ERROR',
            name: 'Erro de conexão',
            success: false,
            message: 'Erro ao conectar com o servidor',
          }]
        )

        toast.error('Erro ao conectar com o servidor')
      }
    } catch (err: any) {
      console.error('❌ Erro ao enviar conteúdos:', err)
      toast.error(err.response?.data?.message || 'Erro ao enviar conteúdos')

      errorUpload(
        'Erro ao enviar conteúdos',
        [{
          id: 'ERROR',
          name: 'Erro geral',
          success: false,
          message: err.response?.data?.message || err.message || 'Erro desconhecido',
        }]
      )
    }
  }

  // Loading State
  if (loading) {
    return (
      <ProtectedRoute>
        <DiaryDetailsSkeleton />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-background pb-20">

        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/disciplines" className="inline-block">
              <Button variant="ghost" className="pl-0 gap-2 text-slate-500 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-transparent group">
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-full p-1 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                <span className="font-semibold">Voltar para Disciplinas</span>
              </Button>
            </Link>
          </div>

          {/* Header Action Bar */}
          <div className="mb-8 flex flex-col gap-6 bg-white dark:bg-card p-6 rounded-[2rem] border border-slate-200 dark:border-border shadow-sm dark:shadow-none relative overflow-hidden">
            <div className="relative z-10 w-full">
              {diaryInfo && (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {diaryInfo.periodo && (
                      <Badge variant="outline" className="bg-slate-50 dark:bg-secondary text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-border uppercase tracking-widest text-[10px] font-bold">
                        {diaryInfo.periodo}
                      </Badge>
                    )}
                    {diaryInfo.externalId && (
                      <a
                        href={`https://academico.ifms.edu.br/administrativo/professores/diario/${diaryInfo.externalId}/conteudo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link"
                        title="Abrir no Sistema IFMS"
                      >
                        <Badge variant="outline" className="bg-slate-50 dark:bg-secondary text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-border font-mono text-[10px] group-hover/link:bg-blue-50 dark:group-hover/link:bg-blue-900/20 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 group-hover/link:border-blue-200 dark:group-hover/link:border-blue-800 transition-colors cursor-pointer flex items-center gap-1">
                          ID: {diaryInfo.externalId}
                          <ExternalLink className="h-3 w-3" />
                        </Badge>
                      </a>
                    )}
                    {diaryInfo.turma && (
                      <Badge variant="outline" className="bg-slate-50 dark:bg-secondary text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-border font-mono text-[10px]">
                        Turma: {diaryInfo.turma}
                      </Badge>
                    )}
                    <Badge
                      className={`uppercase tracking-widest text-[10px] font-bold border-0 ${diaryInfo.aprovado
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-200"
                        }`}
                    >
                      {diaryInfo.aprovado ? "Aprovado" : "Em Andamento"}
                    </Badge>
                  </div>

                  {(() => {
                    const text = diaryInfo.disciplina || '';
                    let name = text;

                    if (text.includes(' - ')) {
                      name = text.split(' - ').slice(1).join(' - ');
                    }

                    return (
                      <div className="mb-3">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-foreground leading-tight">
                          {name}
                        </h1>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-slate-500 dark:text-slate-400">
                    {diaryInfo.curso && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        <span className="truncate max-w-[200px] md:max-w-md" title={diaryInfo.curso}>{diaryInfo.curso}</span>
                      </div>
                    )}
                    {diaryInfo.cargaHorariaRelogio && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span title="Carga Horária Relógio">{Number(diaryInfo.cargaHorariaRelogio).toFixed(2)}h</span>
                        {diaryInfo.cargaHorariaAulas && (
                          <span className="text-slate-400 dark:text-muted-foreground text-xs font-medium" title="Carga Horária Aulas">
                            ({diaryInfo.cargaHorariaAulas} aulas)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="relative z-10 flex flex-wrap gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={downloadState?.status === 'syncing' || uploadState?.status === 'syncing'}
                className="h-10 border-slate-200 dark:border-border text-slate-700 dark:text-foreground font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800"
              >
                {downloadState?.status === 'syncing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar do Sistema
                  </>
                )}
              </Button>



              <Button
                variant="default"
                size="sm"
                onClick={handleSendToSystem}
                disabled={downloadState?.status === 'syncing' || uploadState?.status === 'syncing' || loading || content.length === 0}
                className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
              >
                {uploadState?.status === 'syncing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar para o Sistema
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sync Progress Display */}
          {(downloadState || uploadState) && (
            <div className="mb-6 animate-fade-in">
              {downloadState && (
                <SyncProgressDisplay
                  state={downloadState}
                  isConnected={true}
                />
              )}
              {uploadState && (
                <SyncProgressDisplay
                  state={uploadState}
                  isConnected={true}
                />
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && content.length === 0 && (
            <div className="bg-white dark:bg-card rounded-[2rem] border border-dashed border-slate-200 dark:border-border p-12 text-center">
              <div className="bg-slate-50 dark:bg-secondary p-4 rounded-full inline-block mb-4">
                <FileText className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-foreground mb-2">Nenhum conteúdo encontrado</h3>
              <p className="text-slate-500 dark:text-muted-foreground max-w-md mx-auto mb-6">
                Este diário ainda não possui conteúdo de aulas registrado.
                Use o botão "Baixar do Sistema" para sincronizar.
              </p>
              <Button variant="outline" onClick={handleSync} className="font-semibold text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <Download className="h-4 w-4 mr-2" />
                Sincronizar Agora
              </Button>
            </div>
          )}

          {/* Content List */}
          {!loading && content.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Conteúdos de Aula
                </h3>
                <div className="text-sm font-medium text-slate-500 dark:text-muted-foreground">
                  {stats ? (
                    <div className="flex gap-4">
                      <span><strong className="text-slate-900 dark:text-foreground">{stats.realClasses}</strong> aulas</span>
                      {stats.anticipations > 0 && (
                        <span className="text-amber-600">+ <strong>{stats.anticipations}</strong> antecipações</span>
                      )}
                      <span className="text-slate-400">({stats.total} total)</span>
                    </div>
                  ) : (
                    <span>{content.length} registros</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-background rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                <DiaryContentTable
                  contents={content}
                  onReorder={handleReorder}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute >
  )
}
