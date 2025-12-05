'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Filter, Plus, Download, Upload, RefreshCw, Loader2, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useState, useEffect } from "react"
import { academicApi, Diary, TeachingPlan } from "@/services/api"
import { toast } from "sonner"
import { useSyncProgress } from "@/hooks/useSyncProgress"
import { SyncProgressDisplay } from "@/components/sync/SyncProgressDisplay"

export default function DisciplinesPage() {
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [diaryPlans, setDiaryPlans] = useState<Record<string, TeachingPlan[]>>({})
  const [loadingPlans, setLoadingPlans] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  // Hook de progresso SSE
  const { progress, isConnected, connect, disconnect } = useSyncProgress()

  useEffect(() => {
    loadDiaries()
  }, [])

  const loadDiaries = async () => {
    try {
      setLoading(true)
      const data = await academicApi.getDiaries()
      setDiaries(data)
      
      // Load teaching plans for each diary
      data.forEach(diary => {
        loadTeachingPlans(diary.id)
      })
      
      // Get last sync from most recent diary update
      if (data.length > 0) {
        const mostRecent = data.reduce((latest, diary) => {
          return new Date(diary.updatedAt) > new Date(latest.updatedAt) ? diary : latest
        })
        setLastSync(new Date(mostRecent.updatedAt))
      }
    } catch (err: any) {
      console.error('Erro ao carregar diários:', err)
      toast.error('Erro ao carregar diários')
    } finally {
      setLoading(false)
    }
  }

  const loadTeachingPlans = async (diaryId: string) => {
    try {
      setLoadingPlans(prev => ({ ...prev, [diaryId]: true }))
      const plans = await academicApi.getDiaryTeachingPlans(diaryId)
      setDiaryPlans(prev => ({ ...prev, [diaryId]: plans }))
    } catch (err: any) {
      console.error(`Erro ao carregar planos do diário ${diaryId}:`, err)
    } finally {
      setLoadingPlans(prev => ({ ...prev, [diaryId]: false }))
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      
      // Conectar ao SSE para receber atualizações em tempo real
      connect()
      
      toast.info('Iniciando sincronização...')
      
      const result = await academicApi.syncDiaries()
      
      if (result.success) {
        toast.success(result.message || 'Sincronização concluída com sucesso!')
        // Wait for sync to complete, then reload
        await new Promise(resolve => setTimeout(resolve, 2000))
        await loadDiaries()
      } else {
        toast.error(result.message || 'Erro ao sincronizar diários')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao sincronizar diários')
    } finally {
      setSyncing(false)
      // Desconectar SSE após alguns segundos
      setTimeout(() => {
        disconnect()
      }, 3000)
    }
  }
  
  // Detectar quando sincronização termina pelo progresso
  useEffect(() => {
    if (progress?.stage === 'completed') {
      // Recarregar diários quando completar
      setTimeout(() => {
        loadDiaries()
      }, 1000)
    }
  }, [progress])

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
                <RefreshCw className={`h-5 w-5 text-blue-600 ${syncing ? 'animate-spin' : ''}`} />
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
                disabled={syncing}
              >
                {syncing ? (
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

        {/* Sync Progress Display */}
        {(isConnected || syncing) && (
          <div className="mb-6">
            <SyncProgressDisplay progress={progress} isConnected={isConnected} />
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
              {diaries.map((diary) => {
                const plans = diaryPlans[diary.id] || []
                const isLoadingPlans = loadingPlans[diary.id]
                
                return (
                  <Card key={diary.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {diary.turma}
                            </Badge>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
                              Em Andamento
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{diary.disciplina}</CardTitle>
                          <CardDescription className="mt-1">
                            {diary.curso}
                          </CardDescription>
                          {diary.periodo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Período: {diary.periodo}
                            </p>
                          )}
                        </div>
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Teaching Plans Section */}
                      {isLoadingPlans ? (
                        <div className="mb-4 p-3 bg-muted/50 rounded-md flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Carregando planos...</span>
                        </div>
                      ) : plans.length > 0 ? (
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              {plans.length} {plans.length === 1 ? 'Plano de Ensino' : 'Planos de Ensino'}
                            </span>
                          </div>
                          {plans.map((plan) => (
                            <Link
                              key={plan.id}
                              href={`/teaching-plans/${plan.id}`}
                              className="block p-3 bg-muted/30 hover:bg-muted/60 rounded-md transition-colors border border-transparent hover:border-primary/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {plan.unidadeCurricular || diary.disciplina}
                                  </p>
                                  {plan.professores && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Prof. {plan.professores}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {plan.status}
                                    </Badge>
                                    {plan.anoSemestre && (
                                      <span className="text-xs text-muted-foreground">
                                        {plan.anoSemestre}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800">Nenhum plano de ensino encontrado</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Sincronize novamente ou crie um plano manualmente
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Link href="/generate" className="flex-1">
                          <Button variant="default" size="sm" className="w-full">
                            Gerar Plano com IA
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

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
                    <Button className="gap-2" onClick={handleSync} disabled={syncing}>
                      {syncing ? (
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
