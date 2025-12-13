'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Filter, Plus, Download, Upload, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useMemo, useEffect } from "react"
import { useSyncProgress } from "@/hooks/useSyncProgress"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"
import { useDiaries, useSyncDiaries } from "@/hooks/api"
import { DiaryCard } from "./DiaryCard"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"

export default function DisciplinesPage() {
  const queryClient = useQueryClient()
  // React Query hooks
  const { data: diaries = [], isLoading: loading } = useDiaries()
  const { mutate: syncDiaries, isPending: isSyncing } = useSyncDiaries()

  // Sistema de sincronização genérico
  const { state: syncState, startSync, complete, error: syncError, reset } = useSyncState('download')

  // Hook de progresso SSE (mantido para compatibilidade)
  const { progress, isConnected, connect, disconnect } = useSyncProgress()

  // Calculate last sync from diaries
  const lastSync = useMemo(() => {
    if (diaries.length === 0) return null
    const mostRecent = diaries.reduce((latest, diary) => {
      return new Date(diary.updatedAt) > new Date(latest.updatedAt) ? diary : latest
    })
    return new Date(mostRecent.updatedAt)
  }, [diaries])

  const handleSync = async () => {
    try {
      startSync(1, 'Conectando ao servidor...')

      // Conectar ao SSE para receber atualizações em tempo real
      connect()

      // Aguardar um pouco para garantir que SSE conectou
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use the React Query mutation
      syncDiaries(undefined, {
        onError: (err: any) => {
          syncError(err.response?.data?.message || 'Erro ao sincronizar diários', [{
            id: 'ERROR',
            name: 'Erro de sincronização',
            success: false,
            message: err.response?.data?.message || err.message
          }])
          disconnect()
        }
      })
      // Success is handled by the mutation's onSuccess
      // Se success, mantém em syncing até SSE enviar 'completed' ou 'error'
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err)
      syncError(err.response?.data?.message || 'Erro ao sincronizar diários', [{
        id: 'ERROR',
        name: 'Erro de sincronização',
        success: false,
        message: err.response?.data?.message || err.message
      }])
      disconnect()
    }
  }

  // Detectar quando sincronização termina pelo progresso SSE
  useEffect(() => {
    if (progress?.stage === 'completed') {
      complete('Sincronização concluída com sucesso!')

      // Invalidate queries to ensure fresh data after sync completes
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })

      // React Query will refetch automatically via mutation onSuccess
      setTimeout(() => {
        disconnect()
        reset()
      }, 2000)
    } else if (progress?.stage === 'error') {
      syncError(progress.message || 'Erro na sincronização')
      setTimeout(() => {
        disconnect()
      }, 2000)
    }
  }, [progress, complete, syncError, disconnect, reset, queryClient])

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca'

    const now = new Date()
    const syncTime = new Date(lastSync)
    const diff = now.getTime() - syncTime.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) {
      return 'Agora mesmo'
    } else if (minutes < 60) {
      return `Há ${minutes} minuto${minutes !== 1 ? 's' : ''}`
    } else if (hours < 24) {
      return `Hoje às ${syncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (days === 1) {
      return `Ontem às ${syncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return syncTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Minhas Disciplinas</h2>
            <p className="text-muted-foreground">
              Gerencie suas disciplinas e sincronize com o sistema acadêmico
            </p>
          </div>

          {/* Sync Banner */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className={`h-5 w-5 text-blue-600 ${syncState?.status === 'syncing' ? 'animate-spin' : ''}`} />
                  <div>
                    <h3 className="font-semibold text-blue-900">Sincronização Automática</h3>
                    <p className="text-sm text-blue-700">
                      Última sincronização: {formatLastSync()} • {diaries.length} {diaries.length === 1 ? 'diário' : 'diários'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 border-blue-300 hover:bg-blue-100"
                  onClick={handleSync}
                  disabled={syncState?.status === 'syncing'}
                >
                  {syncState?.status === 'syncing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sincronizar Agora
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Progress Display - Novo Sistema */}
          {syncState && (
            <div className="mb-6">
              <SyncProgressDisplay
                state={syncState}
                progress={progress}
                isConnected={isConnected}
              />
            </div>
          )}

          {/* Sync Progress Display - Sistema SSE (quando não há syncState) */}
          {progress && !syncState && (
            <div className="mb-6">
              <SyncProgressDisplay
                state={null}
                progress={progress}
                isConnected={isConnected}
              />
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar disciplinas..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Disciplines Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {diaries.map((diary) => (
                  <DiaryCard key={diary.id} diary={diary} />
                ))}

                {/* Add Manual Discipline Card */}
                <Card className="border-dashed bg-muted/20 hover:border-primary/50 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center h-full py-12">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-semibold mb-2">Adicionar Disciplina Manual</h4>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Crie uma disciplina que não está no sistema acadêmico
                    </p>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Disciplina
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Empty State */}
              {diaries.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum diário encontrado</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">
                      Sincronize com o sistema acadêmico IFMS para importar seus diários automaticamente
                    </p>
                    <div className="flex gap-3">
                      <Button className="gap-2" onClick={handleSync} disabled={syncState?.status === 'syncing'}>
                        {syncState?.status === 'syncing' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Sincronizar do Sistema
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Manual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
