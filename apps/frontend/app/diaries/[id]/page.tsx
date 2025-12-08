'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Loader2, FileText, Download, ExternalLink, Upload } from "lucide-react"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { academicApi, DiaryContent } from "@/services/api"
import { toast } from "sonner"
import { DiaryContentTable } from "@/components/diary/DiaryContentTable"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"

export default function DiaryContentPage() {
  const params = useParams()
  const router = useRouter()
  const diaryId = params?.id as string

  const [content, setContent] = useState<DiaryContent[]>([])
  const [loading, setLoading] = useState(true)
  const [diaryInfo, setDiaryInfo] = useState<any>(null)
  const [stats, setStats] = useState<{ total: number; realClasses: number; anticipations: number } | null>(null)
  
  // Sistema de sincronização para download
  const { state: downloadState, startSync: startDownload, complete: completeDownload, error: errorDownload, reset: resetDownload } = useSyncState('download')
  
  // Sistema de sincronização para upload
  const { state: uploadState, startSync: startUpload, complete: completeUpload, error: errorUpload, reset: resetUpload } = useSyncState('upload')

  useEffect(() => {
    if (diaryId) {
      loadDiaryContent()
      loadDiaryInfo()
      loadStats()
    }
  }, [diaryId])

  const loadDiaryContent = async () => {
    try {
      setLoading(true)
      const data = await academicApi.getDiaryContent(diaryId)
      
      // Separar aulas normais e antecipações
      const normalClasses = data.filter(item => !item.isAntecipation)
      const anticipations = data.filter(item => item.isAntecipation)
      
      // Identificar IDs de aulas que foram antecipadas (para não incluir na ordem cronológica)
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
      
      // Ordenar todas as aulas ativas (regulares + antecipações) por data e horário
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
        
        // Se for uma antecipação, adicionar a aula original (cancelada) logo abaixo
        if (item.isAntecipation && item.originalContentId) {
          const cancelledClass = anticipatedClassMap.get(item.originalContentId)
          if (cancelledClass) {
            result.push(cancelledClass)
          }
        }
      })
      
      setContent(result)
    } catch (err: any) {
      console.error('Erro ao carregar conteúdo do diário:', err)
      toast.error('Erro ao carregar conteúdo do diário')
    } finally {
      setLoading(false)
    }
  }

  const loadDiaryInfo = async () => {
    try {
      const diaries = await academicApi.getDiaries()
      const diary = diaries.find(d => d.id === diaryId)
      setDiaryInfo(diary)
    } catch (err: any) {
      console.error('Erro ao carregar informações do diário:', err)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await academicApi.getDiaryContentStats(diaryId)
      setStats(statsData)
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  const handleReorder = async (reorderedContents: DiaryContent[]) => {
    console.log('Nova ordem dos conteúdos:', reorderedContents.map(c => ({
      id: c.id,
      date: c.date,
      timeRange: c.timeRange,
      content: c.content?.substring(0, 50) + '...'
    })))
    
    // Atualizar estado local
    setContent(reorderedContents)
    
    // TODO: Salvar nova ordem no backend
    // await academicApi.updateDiaryContentOrder(diaryId, reorderedContents)
    
    toast.success('Ordem atualizada!')
  }

  const handleSync = async () => {
    startDownload(1, 'Baixando conteúdos do sistema IFMS...')
    
    try {
      const result = await academicApi.syncSpecificDiary(diaryId)
      
      completeDownload(`${result.synced} conteúdos atualizados com sucesso!`)
      toast.success(`Diário sincronizado! ${result.synced} conteúdos atualizados`)
      
      // Força o recarregamento dos dados
      setLoading(true)
      await Promise.all([
        loadDiaryContent(),
        loadStats(),
        loadDiaryInfo()
      ])
      setLoading(false)
      
      // Reset após 2 segundos
      setTimeout(() => {
        resetDownload()
      }, 2000)
      
    } catch (error: any) {
      console.error('Erro ao sincronizar diário:', error)
      toast.error(error.response?.data?.message || 'Erro ao sincronizar diário')
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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/academic/diaries/${diaryId}/content/send-bulk-sse?contentIds=${contentIds.join(',')}&token=${token}`
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto py-8 px-4 max-w-6xl">
          {/* Page Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/disciplines')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex-1">
              <h2 className="text-3xl font-bold">Conteúdo do Diário</h2>
              {diaryInfo && (
                <p className="text-muted-foreground mt-1">
                  {diaryInfo.disciplina} • {diaryInfo.turma}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={downloadState?.status === 'syncing' || uploadState?.status === 'syncing'}
                className="gap-2"
              >
                {downloadState?.status === 'syncing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Baixar do Sistema
                  </>
                )}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleSendToSystem}
                disabled={downloadState?.status === 'syncing' || uploadState?.status === 'syncing' || loading || content.length === 0}
                className="gap-2"
              >
                {uploadState?.status === 'syncing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar para o Sistema
                  </>
                )}
              </Button>
              
              {diaryInfo?.externalId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(`https://academico.ifms.edu.br/administrativo/professores/diario/${diaryInfo.externalId}/conteudo`, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Sistema IFMS
                </Button>
              )}
            </div>
          </div>

          {/* Sync Progress Display - Download */}
          {downloadState && (
            <div className="mb-6">
              <SyncProgressDisplay 
                state={downloadState}
                isConnected={true}
              />
            </div>
          )}

          {/* Sync Progress Display - Upload */}
          {uploadState && (
            <div className="mb-6">
              <SyncProgressDisplay 
                state={uploadState}
                isConnected={true}
              />
            </div>
          )}

          {/* Diary Info Card */}
          {diaryInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Informações do Diário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID do Diário (IFMS)</p>
                    <p className="text-sm mt-1 font-mono bg-muted px-2 py-1 rounded">{diaryInfo.externalId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Curso</p>
                    <p className="text-sm mt-1">{diaryInfo.curso}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Período</p>
                    <p className="text-sm mt-1">{diaryInfo.periodo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Carga Horária</p>
                    <p className="text-sm mt-1">{diaryInfo.cargaHoraria || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Alunos em Curso</p>
                    <p className="text-sm mt-1">{diaryInfo.emCurso}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ano/Semestre</p>
                    <p className="text-sm mt-1">
                      {diaryInfo.anoLetivo && diaryInfo.semestre 
                        ? `${diaryInfo.anoLetivo}/${diaryInfo.semestre}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={diaryInfo.aprovado ? "default" : "secondary"} className="mt-1">
                      {diaryInfo.aprovado ? "Aprovado" : "Em Andamento"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Carregando conteúdo...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && content.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum conteúdo encontrado</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Este diário ainda não possui conteúdo de aulas registrado. Sincronize novamente para obter os dados mais recentes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content List */}
          {!loading && content.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {stats ? (
                    <div className="flex gap-4">
                      <span><strong>{stats.realClasses}</strong> aulas ministradas</span>
                      {stats.anticipations > 0 && (
                        <span className="text-green-600">+ <strong>{stats.anticipations}</strong> antecipações</span>
                      )}
                      <span className="text-muted-foreground/70">({stats.total} total)</span>
                    </div>
                  ) : (
                    <span>{content.length} {content.length === 1 ? 'registro' : 'registros'}</span>
                  )}
                </div>
              </div>

              <DiaryContentTable 
                contents={content}
                onReorder={handleReorder}
              />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
